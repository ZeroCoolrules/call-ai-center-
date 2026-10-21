// AI Text Assistant: drafts replies to texts on your own number and learns,
// type by type, when it can answer without you.
//
// Every new text is sorted into a type (booking, hours, prices...) and the AI
// writes a draft. You approve, edit or dismiss it in the dashboard. Each type
// keeps score of how often you send the draft unchanged; once it reaches the
// bar in Settings (10 drafts, 90% unchanged by default) that type switches to
// auto-reply. Upset customers, requests for a person and anything unclear always
// wait for you.
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import {
  CATEGORY_LABELS,
  NEVER_AUTO,
  TEXT_CATEGORIES,
  type CategoryStats,
  type CategoryView,
  type TextCategory,
  type TextDraft,
  type TextSettings,
  type TextStatus,
  type ThreadSummary,
} from '../src/types/texts';
import { db, newId, save, DEFAULT_TEXT_SETTINGS } from './store';
import { chatCompletion, type ChatTurn } from './llm';
import { addDnc, isDnc, normalizePhone, removeDnc, zonedToUtc } from './compliance';
import { createAppointment, rescheduleAppointment, slotProblem, slotsSentence, suggestSlots, syncCalendar } from './appointments';
import { handleAppointmentSms } from './reminders';
import { businessHourLabel, formatWhen } from './scripts';
import { adminPasswordSet } from './auth';
import { publicBaseUrl } from './twilio';
import {
  WEBHOOK_PATH,
  gatewayConfigured,
  gatewayMode,
  gatewaySignatureValid,
  recordText,
  registerWebhook,
  sendGatewaySms,
  signingKeySet,
} from './phoneGateway';

const PRODUCTION = process.env.NODE_ENV === 'production' || process.argv.includes('--prod') || !!process.env.RENDER;
const RECENT_WINDOW = 20;
const EXAMPLES_PER_TYPE = 8;
const MIN_AUTO_CONFIDENCE = 0.7;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "cancel" is left out on purpose: on your own number it almost always means an appointment.
const OPT_OUT = new Set(['stop', 'stopall', 'unsubscribe', 'end', 'quit']);
const OPT_IN = new Set(['start', 'unstop']);

// ── Learning ────────────────────────────────────────────────────────────────
function stats(cat: TextCategory): CategoryStats {
  let s = db.texts.categories[cat];
  if (!s) {
    s = { mode: 'review', approved: 0, edited: 0, dismissed: 0, autoSent: 0, recent: [] };
    db.texts.categories[cat] = s;
  }
  return s;
}

function accuracy(s: CategoryStats): number {
  return s.recent.length ? Math.round((s.recent.filter(Boolean).length / s.recent.length) * 100) : 0;
}

function earnedAuto(cat: TextCategory, s: CategoryStats): boolean {
  const t = db.texts.settings;
  return !NEVER_AUTO.includes(cat) && s.recent.length >= t.promoteAfter && accuracy(s) >= t.promoteAccuracy;
}

// Small wording fixes (punctuation, capitals, spacing) still count as "unchanged".
function sameText(a: string, b: string): boolean {
  const n = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return n(a) === n(b);
}

function learn(d: TextDraft, finalText: string) {
  const s = stats(d.category);
  const unchanged = !d.aiFailed && sameText(d.draft, finalText);
  if (unchanged) s.approved++;
  else s.edited++;
  s.recent = [...s.recent, unchanged].slice(-RECENT_WINDOW);
  // Your own wording teaches the AI how you answer this type of text.
  db.texts.examples.push({ category: d.category, inbound: d.inboundText.slice(0, 300), reply: finalText.slice(0, 500), at: new Date().toISOString() });
  const mine = db.texts.examples.filter(e => e.category === d.category);
  if (mine.length > EXAMPLES_PER_TYPE) {
    const drop = new Set(mine.slice(0, mine.length - EXAMPLES_PER_TYPE));
    db.texts.examples = db.texts.examples.filter(e => !drop.has(e));
  }
  if (s.mode === 'review' && db.texts.settings.autoPromote && earnedAuto(d.category, s)) {
    s.mode = 'auto';
    s.promotedAt = new Date().toISOString();
    console.log(`[texts] "${d.category}" texts now reply automatically (${accuracy(s)}% sent unchanged)`);
  }
}

// ── Drafting ────────────────────────────────────────────────────────────────
function nameFor(phone: string): string | undefined {
  const a = [...db.appointments].reverse().find(x => x.phone === phone && x.name && x.name !== 'Customer');
  if (a) return a.name;
  return db.contacts.find(c => c.phone === phone && c.name)?.name;
}

function upcomingAppointment(phone: string) {
  return db.appointments
    .filter(a => a.phone === phone && a.status !== 'cancelled' && a.status !== 'completed' && new Date(a.startsAt).getTime() > Date.now())
    .sort((x, y) => x.startsAt.localeCompare(y.startsAt))[0];
}

function localSlot(d: Date, tz: string): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d);
  const g = (t: string) => p.find(x => x.type === t)?.value;
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;
}

function buildPrompt(phone: string, hint?: string): string {
  const s = db.settings;
  const t = db.texts.settings;
  const bh = s.businessHours;
  const tz = bh.timezone;
  const now = new Date().toLocaleString('en-US', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const appt = upcomingAppointment(phone);
  const open = suggestSlots(s.defaultAppointmentMinutes, 6, appt?.id);
  const examples = db.texts.examples
    .slice(-30)
    .map(e => `[${e.category}] Customer: "${e.inbound}"\nOwner replied: "${e.reply}"`)
    .join('\n\n');

  return [
    `You draft text message replies for "${s.businessName}". The owner reviews your drafts, so write exactly what they would send.`,
    `Right now it is ${now} (${tz}).`,
    '',
    'BUSINESS',
    `- Address: ${s.businessAddress || 'not provided'}`,
    `- Open for appointments: ${businessHourLabel(bh.startHour)} to ${businessHourLabel(bh.endHour)}, ${bh.days.map(d => DAY_NAMES[d]).join(', ')}`,
    `- Appointments last about ${s.defaultAppointmentMinutes} minutes.`,
    t.businessInfo.trim() ? `- Owner's notes (prices, services, policies, FAQs):\n${t.businessInfo.trim()}` : '- No prices or service list provided.',
    '',
    'THIS CUSTOMER',
    `- Name: ${nameFor(phone) || 'unknown'}`,
    appt ? `- Upcoming appointment: ${appt.service} on ${formatWhen(appt.startsAt, tz)}` : '- No upcoming appointment.',
    '',
    'OPEN TIMES YOU MAY OFFER (local time, value to use for booking in brackets)',
    open.length ? open.map(d => `- ${formatWhen(d.toISOString(), tz)} [${localSlot(d, tz)}]`).join('\n') : '- None in the next 3 weeks; say the owner will follow up.',
    '',
    examples ? `HOW THE OWNER ANSWERS (match this tone and wording)\n${examples}\n` : '',
    'RULES',
    '- 1-3 short, friendly sentences. Plain text, no markdown.',
    '- Only state prices, services and policies found above. If you do not know, say you will check and get right back to them, and set confidence below 0.5.',
    '- To book or move an appointment, offer 2-3 of the open times. Only fill "book" when the customer clearly agreed to one specific open time.',
    '- If they are upset, mention a lawyer, refund or chargeback, an emergency, or ask for a person, use category "urgent" and reply that the owner will reach out personally.',
    hint ? `- The owner asked for this draft: ${hint}` : '',
    '',
    'Answer with ONLY a JSON object, nothing else:',
    `{"category": one of ${JSON.stringify(TEXT_CATEGORIES)}, "confidence": number from 0 to 1, "reply": "the text to send", "book": "YYYY-MM-DDTHH:MM" or ""}`,
  ]
    .filter(l => l !== '')
    .join('\n');
}

// Keyword fallback when the AI is offline or returns something unreadable.
function guessCategory(text: string): TextCategory {
  const t = text.toLowerCase();
  if (/\b(lawyer|sue|refund|chargeback|complain|terrible|worst|angry|ridiculous|manager|real person|human|emergency|urgent)\b/.test(t)) return 'urgent';
  if (/\b(cancel|call off)\b/.test(t)) return 'cancel';
  if (/\b(reschedul|move my|change my|different (day|time)|can'?t make it|push (it|my))\b/.test(t)) return 'reschedule';
  if (/\b(book|appointment|appt|schedule|available|availability|opening|slot|come in)\b/.test(t)) return 'booking';
  if (/\b(hours|open|close|closing|today|tomorrow|weekend|sunday|saturday)\b/.test(t)) return 'hours';
  if (/\b(where|address|located|location|directions|parking|park)\b/.test(t)) return 'location';
  if (/\b(price|cost|how much|\$|rate|charge|fee|quote)\b/.test(t)) return 'pricing';
  if (/\b(do you (do|offer|have)|services?|offer)\b/.test(t)) return 'services';
  if (/^(ok|okay|k|thanks|thank you|thx|ty|great|perfect|sounds good|see you|cool|got it)[.! ]*$/i.test(t.trim())) return 'thanks';
  return 'other';
}

interface Drafted {
  category: TextCategory;
  confidence: number;
  reply: string;
  book?: string;
  aiFailed?: boolean;
}

function parseDraft(raw: string, inbound: string): Drafted | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    const reply = String(j.reply || '').trim();
    if (!reply) return null;
    const guess = guessCategory(inbound);
    // Safety net: obvious anger / "real person" words always go to you, whatever the AI thought.
    const category = guess === 'urgent' ? 'urgent' : (TEXT_CATEGORIES as readonly string[]).includes(j.category) ? (j.category as TextCategory) : guess;
    const confidence = Math.max(0, Math.min(1, Number(j.confidence) || 0));
    const book = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(j.book || '')) ? String(j.book) : undefined;
    return { category, confidence, reply, book };
  } catch {
    return null;
  }
}

async function draftReply(phone: string, inbound: string, hint?: string): Promise<Drafted> {
  const history = db.texts.messages.filter(m => m.phone === phone && !m.failed).slice(-12);
  // The newest inbound text is already in the log; send it last as the question.
  if (history.length && history[history.length - 1].direction === 'in') history.pop();
  const turns: ChatTurn[] = [{ role: 'system', content: buildPrompt(phone, hint) }];
  for (const m of history) turns.push({ role: m.direction === 'in' ? 'user' : 'assistant', content: m.text });
  turns.push({ role: 'user', content: `New text from the customer: "${inbound}"\nReply with the JSON object only.` });
  try {
    const parsed = parseDraft(await chatCompletion(turns, 0.2), inbound);
    if (parsed) {
      const sig = db.texts.settings.signature.trim();
      if (sig && !parsed.reply.endsWith(sig)) parsed.reply = `${parsed.reply} ${sig}`;
      return parsed;
    }
    console.error('[texts] AI reply was not valid JSON');
  } catch (err: any) {
    console.error('[texts] AI draft failed:', err.message);
  }
  return { category: guessCategory(inbound), confidence: 0, reply: '', aiFailed: true };
}

// ── Sending ─────────────────────────────────────────────────────────────────
async function deliver(phone: string, text: string, by: 'you' | 'ai-approved' | 'ai-auto', test?: boolean) {
  if (test) {
    recordText({ phone, direction: 'out', text, by, test: true });
    return;
  }
  try {
    await sendGatewaySms(phone, text);
    recordText({ phone, direction: 'out', text, by });
  } catch (err: any) {
    recordText({ phone, direction: 'out', text, by, failed: err.message });
    throw err;
  }
}

// Books/moves the appointment the draft agreed to. Returns '' or a problem.
async function bookFromDraft(d: TextDraft): Promise<string> {
  if (!d.book) return '';
  const tz = db.settings.businessHours.timezone;
  const start = zonedToUtc(d.book, tz);
  if (!start) return 'The AI picked a time it could not read.';
  const existing = d.category === 'reschedule' ? upcomingAppointment(d.phone) : undefined;
  const minutes = existing?.durationMinutes || db.settings.defaultAppointmentMinutes;
  const problem = slotProblem(start, minutes, existing?.id);
  if (problem) return `Could not book ${formatWhen(start.toISOString(), tz)}: ${problem}. ${slotsSentence(suggestSlots(minutes, 3, existing?.id))}`;
  if (d.test) return '';
  if (existing) {
    await rescheduleAppointment(existing, start, 'text assistant');
  } else {
    const appt = createAppointment({ name: d.name || nameFor(d.phone) || 'Customer', phone: d.phone, startsAt: start, source: 'text assistant' });
    await syncCalendar(appt);
  }
  return '';
}

async function sendDraft(d: TextDraft, text: string, by: 'ai-approved' | 'ai-auto') {
  const problem = await bookFromDraft(d);
  if (problem) throw new Error(problem);
  await deliver(d.phone, text, by, d.test);
  d.status = 'sent';
  d.finalText = text;
  d.edited = !sameText(d.draft, text);
  d.resolvedAt = new Date().toISOString();
  save();
}

// ── Incoming texts ──────────────────────────────────────────────────────────
function autoBlocker(d: TextDraft, s: CategoryStats): string {
  const t = db.texts.settings;
  if (d.aiFailed) return 'The AI was offline, so this needs your reply.';
  if (s.mode !== 'auto') return '';
  if (t.autoReplyPaused) return 'Auto-replies are paused.';
  if (NEVER_AUTO.includes(d.category)) return '';
  if (d.confidence < MIN_AUTO_CONFIDENCE) return `The AI wasn't sure (${Math.round(d.confidence * 100)}% confident).`;
  if (isDnc(d.phone)) return 'This number is on your Do Not Call list.';
  return 'ok';
}

export async function handleIncomingText(fromRaw: string, body: string, opts: { test?: boolean } = {}): Promise<TextDraft | null> {
  const phone = normalizePhone(fromRaw) || fromRaw;
  const text = body.trim();
  if (!text) return null;
  recordText({ phone, direction: 'in', text, test: opts.test });
  const word = text.toLowerCase().replace(/[^a-z]/g, '');

  // Your own number has no carrier STOP handling, so we do it here.
  if (OPT_OUT.has(word)) {
    addDnc(phone, `texted ${text.toUpperCase()}`);
    db.texts.drafts.filter(d => d.phone === phone && d.status === 'pending').forEach(d => (d.status = 'superseded'));
    await deliver(phone, "You're unsubscribed and won't get more texts from us. Reply START to undo.", 'ai-auto', opts.test).catch(() => {});
    return null;
  }
  if (OPT_IN.has(word) && isDnc(phone)) {
    removeDnc(phone);
    await deliver(phone, "You're subscribed again. How can we help?", 'ai-auto', opts.test).catch(() => {});
    return null;
  }

  // Replies to appointment reminders (C / R / X) are handled the same as before.
  if (!opts.test) {
    const apptReply = await handleAppointmentSms(phone, text).catch(() => null);
    if (apptReply !== null) {
      if (apptReply) await deliver(phone, apptReply, 'ai-auto').catch(err => console.error('[texts] reminder reply failed:', err.message));
      return null;
    }
  }

  if (!db.texts.settings.enabled) return null;

  // A newer text replaces any draft still waiting for this person.
  for (const old of db.texts.drafts) if (old.phone === phone && old.status === 'pending') old.status = 'superseded';

  const ai = await draftReply(phone, text);
  const d: TextDraft = {
    id: newId('drf'),
    phone,
    name: nameFor(phone),
    inboundText: text,
    category: ai.category,
    confidence: ai.confidence,
    draft: ai.reply,
    book: ai.book,
    aiFailed: ai.aiFailed,
    status: 'pending',
    createdAt: new Date().toISOString(),
    test: opts.test,
  };
  db.texts.drafts.push(d);
  const s = stats(d.category);
  const blocker = autoBlocker(d, s);
  if (blocker === 'ok') {
    try {
      await sendDraft(d, d.draft, 'ai-auto');
      s.autoSent++;
      console.log(`[texts] auto-replied to ${phone} (${d.category})`);
    } catch (err: any) {
      d.note = `Auto-reply not sent: ${err.message}`;
    }
  } else if (blocker) {
    d.note = blocker;
  }
  save();
  return d;
}

// ── Dashboard API ───────────────────────────────────────────────────────────
function categoryViews(): CategoryView[] {
  return TEXT_CATEGORIES.map(key => {
    const s = stats(key);
    return {
      key,
      label: CATEGORY_LABELS[key],
      ...s,
      accuracy: accuracy(s),
      ready: s.mode === 'review' && earnedAuto(key, s),
      locked: NEVER_AUTO.includes(key),
    };
  });
}

function webhookUrl() {
  const base = publicBaseUrl();
  return base ? `${base}${WEBHOOK_PATH}` : '';
}

function locked() {
  return PRODUCTION && !adminPasswordSet();
}

function status(): TextStatus {
  return {
    gatewayConfigured: gatewayConfigured(),
    gatewayMode: gatewayMode(),
    signingKeySet: signingKeySet(),
    webhookUrl: webhookUrl(),
    publicUrl: publicBaseUrl(),
    locked: locked(),
    settings: db.texts.settings,
    categories: categoryViews(),
    pending: db.texts.drafts.filter(d => d.status === 'pending').length,
  };
}

function cleanTextSettings(i: any, cur: TextSettings): TextSettings {
  const num = (v: any, min: number, max: number, d: number) => (Number.isFinite(+v) ? Math.min(max, Math.max(min, Math.round(+v))) : d);
  const bool = (v: any, d: boolean) => (typeof v === 'boolean' ? v : d);
  return {
    enabled: bool(i.enabled, cur.enabled),
    autoReplyPaused: bool(i.autoReplyPaused, cur.autoReplyPaused),
    autoPromote: bool(i.autoPromote, cur.autoPromote),
    promoteAfter: num(i.promoteAfter, 3, RECENT_WINDOW, cur.promoteAfter ?? DEFAULT_TEXT_SETTINGS.promoteAfter),
    promoteAccuracy: num(i.promoteAccuracy, 50, 100, cur.promoteAccuracy ?? DEFAULT_TEXT_SETTINGS.promoteAccuracy),
    businessInfo: typeof i.businessInfo === 'string' ? i.businessInfo.slice(0, 6000) : cur.businessInfo,
    signature: typeof i.signature === 'string' ? i.signature.slice(0, 60) : cur.signature,
  };
}

const wrap =
  (fn: (req: Request, res: Response) => Promise<any> | any) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(err => {
      console.error('[texts api]', req.method, req.path, err.message);
      res.status(400).json({ error: err.message });
    });

const fail = (msg: string): never => {
  throw new Error(msg);
};

function pendingDraft(id: string): TextDraft {
  const d = db.texts.drafts.find(x => x.id === id);
  if (!d) fail('Draft not found');
  if (d!.status !== 'pending') fail('This text was already handled');
  return d!;
}

export function registerTexts(app: Express) {
  // Webhook from the SMS Gateway app on your phone.
  app.post(WEBHOOK_PATH, (req, res) => {
    if (!gatewaySignatureValid(req)) {
      if (signingKeySet() || PRODUCTION) {
        console.warn('[texts] rejected unsigned/invalid gateway webhook. Check SMS_GATEWAY_SIGNING_KEY.');
        return res.status(401).json({ error: 'invalid signature' });
      }
      console.warn('[texts] accepting unsigned gateway webhook (set SMS_GATEWAY_SIGNING_KEY before going live)');
    }
    const { event, payload, deviceId } = req.body || {};
    res.json({ ok: true }); // answer right away; the app retries on slow responses
    if (event !== 'sms:received' || !payload) return;
    const key = `${deviceId || ''}:${payload.messageId || ''}`;
    if (payload.messageId) {
      if (db.texts.seen.includes(key)) return;
      db.texts.seen.push(key);
    }
    const from = String(payload.sender || payload.phoneNumber || '');
    const text = String(payload.message ?? payload.text ?? '');
    console.log(`[texts] ${from}: "${text}"`);
    handleIncomingText(from, text).catch(err => console.error('[texts] failed:', err.message));
  });

  const api = express.Router();
  api.use((req, res, next) => {
    if (!locked()) return next();
    res.status(403).json({ error: 'Set ADMIN_PASSWORD (Render → Environment) to unlock the text assistant. It can send texts from your phone.' });
  });

  api.get('/status', (req, res) => res.json(status()));

  api.put('/settings', wrap((req, res) => {
    db.texts.settings = cleanTextSettings(req.body || {}, db.texts.settings);
    save();
    res.json(status());
  }));

  api.put('/categories/:key', wrap((req, res) => {
    const key = req.params.key as TextCategory;
    if (!TEXT_CATEGORIES.includes(key)) fail('Unknown type');
    const mode = req.body?.mode;
    if (mode !== 'auto' && mode !== 'review') fail('mode must be auto or review');
    if (mode === 'auto' && NEVER_AUTO.includes(key)) fail('This type always waits for you');
    const s = stats(key);
    s.mode = mode;
    if (mode === 'auto') s.promotedAt = new Date().toISOString();
    save();
    res.json(status());
  }));

  api.post('/categories/:key/reset', wrap((req, res) => {
    const key = req.params.key as TextCategory;
    if (!TEXT_CATEGORIES.includes(key)) fail('Unknown type');
    db.texts.categories[key] = { mode: 'review', approved: 0, edited: 0, dismissed: 0, autoSent: 0, recent: [] };
    db.texts.examples = db.texts.examples.filter(e => e.category !== key);
    save();
    res.json(status());
  }));

  api.get('/drafts', (req, res) => {
    const want = String(req.query.status || 'pending');
    const list = db.texts.drafts.filter(d => (want === 'all' ? d.status !== 'superseded' : d.status === want));
    res.json(list.slice(-200).reverse());
  });

  api.post('/drafts/:id/send', wrap(async (req, res) => {
    const d = pendingDraft(req.params.id);
    const text = String(req.body?.text ?? d.draft).trim();
    if (!text) fail('Write a reply first');
    if (req.body?.book === false) d.book = undefined; // you removed the booking
    await sendDraft(d, text, 'ai-approved');
    learn(d, text);
    save();
    res.json(d);
  }));

  api.post('/drafts/:id/dismiss', wrap((req, res) => {
    const d = pendingDraft(req.params.id);
    d.status = 'dismissed';
    d.resolvedAt = new Date().toISOString();
    stats(d.category).dismissed++;
    save();
    res.json(d);
  }));

  api.post('/drafts/:id/redraft', wrap(async (req, res) => {
    const d = pendingDraft(req.params.id);
    const ai = await draftReply(d.phone, d.inboundText, String(req.body?.hint || '').slice(0, 500) || undefined);
    if (ai.aiFailed) fail('The AI is offline. Write the reply yourself or try again.');
    Object.assign(d, { draft: ai.reply, book: ai.book, confidence: ai.confidence, aiFailed: false, note: undefined });
    if (req.body?.category && TEXT_CATEGORIES.includes(req.body.category)) d.category = req.body.category;
    save();
    res.json(d);
  }));

  api.put('/drafts/:id/category', wrap((req, res) => {
    const d = pendingDraft(req.params.id);
    if (!TEXT_CATEGORIES.includes(req.body?.category)) fail('Unknown type');
    d.category = req.body.category;
    save();
    res.json(d);
  }));

  api.get('/threads', (req, res) => {
    const byPhone = new Map<string, ThreadSummary>();
    for (const m of db.texts.messages) {
      const t = byPhone.get(m.phone) || { phone: m.phone, name: undefined, last: m, pending: 0 };
      t.last = m;
      byPhone.set(m.phone, t);
    }
    for (const t of byPhone.values()) {
      t.name = nameFor(t.phone);
      t.pending = db.texts.drafts.filter(d => d.phone === t.phone && d.status === 'pending').length;
    }
    res.json([...byPhone.values()].sort((a, b) => b.last.at.localeCompare(a.last.at)).slice(0, 300));
  });

  api.get('/threads/:phone', (req, res) => {
    const phone = normalizePhone(req.params.phone) || req.params.phone;
    res.json(db.texts.messages.filter(m => m.phone === phone).slice(-200));
  });

  api.post('/threads/:phone/send', wrap(async (req, res) => {
    const phone = normalizePhone(req.params.phone);
    if (!phone) fail('Invalid phone number');
    const text = String(req.body?.text || '').trim();
    if (!text) fail('Write a message first');
    const test = !!db.texts.messages.filter(m => m.phone === phone).pop()?.test;
    if (!test && !gatewayConfigured()) fail('Connect your phone first (Setup tab).');
    await deliver(phone, text, 'you', test);
    // Replying yourself counts as handling whatever draft was waiting.
    for (const d of db.texts.drafts) {
      if (d.phone === phone && d.status === 'pending') {
        d.status = 'sent';
        d.finalText = text;
        d.edited = true;
        d.resolvedAt = new Date().toISOString();
        learn(d, text);
      }
    }
    save();
    res.json({ ok: true });
  }));

  // Try it without a phone: runs a pretend text through the AI (nothing is sent).
  api.post('/test', wrap(async (req, res) => {
    const text = String(req.body?.text || '').trim();
    if (!text) fail('Type a message to test with');
    const phone = normalizePhone(req.body?.phone) || '+15555550100';
    const d = await handleIncomingText(phone, text, { test: true });
    res.json(d || { note: 'Handled without a draft (opt-out/opt-in word).' });
  }));

  api.post('/connect', wrap(async (req, res) => {
    if (!gatewayConfigured()) fail('Add SMS_GATEWAY_USER and SMS_GATEWAY_PASSWORD first.');
    const url = webhookUrl();
    if (!url) fail('This server has no public https address yet. Set PUBLIC_BASE_URL (or open the dashboard through your public URL).');
    if (!url.startsWith('https://')) fail(`The phone app only sends to https addresses. Current address: ${url}`);
    const result = await registerWebhook(url);
    res.json({ result, url });
  }));

  app.use('/api/texts', api);
}
