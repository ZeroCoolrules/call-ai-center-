// "AI Text Assistant" tab: review AI drafts for texts on your own number,
// watch it learn which types it can answer alone, and connect your phone.
import React, { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Inbox, MessagesSquare, GraduationCap, Settings, Send, X, RefreshCw, CalendarCheck, Bot, User, Lock } from 'lucide-react';
import { CATEGORY_LABELS, TEXT_CATEGORIES, type TextCategory, type TextDraft, type TextMessage, type TextSettings, type TextStatus, type ThreadSummary } from '../../types/texts';
import { textsApi } from './api';
import { Badge, Button, Card, Field, Input, Notice, Select, TextArea, Toggle, useAction } from '../outbound/ui';
import { fmtPhone } from '../outbound/api';

type Section = 'review' | 'threads' | 'learning' | 'setup';
type Msg = { kind: 'error' | 'success'; text: string } | null;

const POLL_MS = 5000;

function when(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function bookLabel(local: string) {
  const [d, t] = local.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return new Date(y, m - 1, day, h, mi).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ── Review queue ────────────────────────────────────────────────────────────
const DraftCard: React.FC<{ d: TextDraft; onDone: () => void; setMsg: (m: Msg) => void }> = ({ d, onDone, setMsg }) => {
  const [text, setText] = useState(d.draft);
  const [book, setBook] = useState(!!d.book);
  const [hint, setHint] = useState('');
  const { busy, run } = useAction(setMsg);
  useEffect(() => {
    setText(d.draft);
    setBook(!!d.book);
  }, [d.draft, d.book]);

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-bold text-white">
          {d.name || fmtPhone(d.phone)} {d.name && <span className="text-slate-500 font-normal">{fmtPhone(d.phone)}</span>}
          {d.test && <span className="ml-2"><Badge value="draft" label="test" /></span>}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={d.category}
            onChange={e => run(() => textsApi.setCategory(d.id, e.target.value as TextCategory).then(onDone))}
            className="!w-auto !py-1 text-xs"
            title="Wrong type? Fix it so the AI learns the right one."
          >
            {TEXT_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
          <span className="text-[11px] text-slate-500">{when(d.createdAt)}</span>
        </div>
      </div>
      <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-sm text-slate-100">“{d.inboundText}”</div>
      {d.note && <p className="text-[11px] text-amber-300">{d.note}</p>}
      <TextArea rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="Write your reply…" className="!font-sans" />
      {d.book && (
        <Toggle checked={book} onChange={setBook} label={<span className="flex items-center gap-1"><CalendarCheck className="w-4 h-4 text-emerald-400" /> Also book {bookLabel(d.book)}</span>} />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button kind="success" disabled={busy || !text.trim()} onClick={() => run(() => textsApi.send(d.id, text, book).then(onDone), 'Sent')}>
          <Send className="w-3.5 h-3.5" /> {text.trim() === d.draft.trim() && d.draft ? 'Approve & send' : 'Send'}
        </Button>
        <Button disabled={busy} onClick={() => run(() => textsApi.dismiss(d.id).then(onDone))}>
          <X className="w-3.5 h-3.5" /> No reply needed
        </Button>
        <div className="flex flex-1 min-w-[220px] gap-2">
          <Input value={hint} onChange={e => setHint(e.target.value)} placeholder="Tell the AI what to say instead (optional)" className="!py-1.5 text-xs" />
          <Button disabled={busy} onClick={() => run(() => textsApi.redraft(d.id, hint).then(() => { setHint(''); onDone(); }))}>
            <RefreshCw className="w-3.5 h-3.5" /> Redraft
          </Button>
        </div>
      </div>
    </div>
  );
};

const ReviewPanel: React.FC<{ drafts: TextDraft[]; reload: () => void; status: TextStatus }> = ({ drafts, reload, status }) => {
  const [msg, setMsg] = useState<Msg>(null);
  const auto = status.categories.filter(c => c.mode === 'auto').map(c => c.label);
  return (
    <div className="space-y-4">
      {msg && <Notice kind={msg.kind} onClose={() => setMsg(null)}>{msg.text}</Notice>}
      <Notice>
        Every new text gets an AI draft. <strong>Approve</strong> it as-is, edit it, or dismiss it. Each time you send a draft without changes, the AI
        gets a point for that type of text. {auto.length ? <>Already replying on its own: <strong>{auto.join(', ')}</strong>.</> : 'Nothing replies on its own yet.'}
      </Notice>
      {drafts.length === 0 ? (
        <Card><p className="text-sm text-slate-400 text-center py-6">All caught up. New texts show up here.</p></Card>
      ) : (
        drafts.map(d => <DraftCard key={d.id} d={d} onDone={reload} setMsg={setMsg} />)
      )}
    </div>
  );
};

// ── Conversations ───────────────────────────────────────────────────────────
const BY_LABEL: Record<string, string> = { you: 'You', 'ai-approved': 'AI (approved)', 'ai-auto': 'AI (auto)', system: 'Automatic' };

const ThreadsPanel: React.FC = () => {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [phone, setPhone] = useState('');
  const [messages, setMessages] = useState<TextMessage[]>([]);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<Msg>(null);
  const { busy, run } = useAction(setMsg);
  const bottom = useRef<HTMLDivElement>(null);

  const load = () => {
    textsApi.threads().then(setThreads).catch(() => {});
    if (phone) textsApi.thread(phone).then(setMessages).catch(() => {});
  };
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [phone]);
  useEffect(() => bottom.current?.scrollIntoView({ block: 'end' }), [messages.length]);

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4">
      <Card title="Conversations" className="max-h-[70vh] overflow-y-auto">
        {threads.length === 0 && <p className="text-xs text-slate-500">No texts yet.</p>}
        <div className="space-y-1">
          {threads.map(t => (
            <button
              key={t.phone}
              onClick={() => setPhone(t.phone)}
              className={`w-full text-left rounded-lg px-3 py-2 ${phone === t.phone ? 'bg-cyan-500/15 border border-cyan-500/40' : 'hover:bg-slate-800/50 border border-transparent'}`}
            >
              <div className="flex justify-between gap-2 text-sm font-bold text-slate-100">
                <span className="truncate">{t.name || fmtPhone(t.phone)}</span>
                {t.pending > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{t.pending}</span>}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{t.last.direction === 'out' ? 'You: ' : ''}{t.last.text}</div>
            </button>
          ))}
        </div>
      </Card>
      <Card title={phone ? fmtPhone(phone) : 'Pick a conversation'}>
        {msg && <div className="mb-3"><Notice kind={msg.kind} onClose={() => setMsg(null)}>{msg.text}</Notice></div>}
        {phone && (
          <>
            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.direction === 'out' ? 'bg-cyan-700/70 text-white' : 'bg-slate-800 text-slate-100'}`}>
                    <div>{m.text}</div>
                    <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                      {m.direction === 'out' && (m.by === 'you' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />)}
                      {m.direction === 'out' && `${BY_LABEL[m.by || 'system']} · `}
                      {when(m.at)}
                      {m.test && ' · test'}
                      {m.failed && <span className="text-rose-300"> · not sent: {m.failed}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <div className="flex gap-2 mt-3">
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type your own reply…" onKeyDown={e => e.key === 'Enter' && text.trim() && !busy && run(() => textsApi.reply(phone, text).then(() => { setText(''); load(); }))} />
              <Button kind="primary" disabled={busy || !text.trim()} onClick={() => run(() => textsApi.reply(phone, text).then(() => { setText(''); load(); }))}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

// ── Learning ────────────────────────────────────────────────────────────────
const LearningPanel: React.FC<{ status: TextStatus; onStatus: (s: TextStatus) => void }> = ({ status, onStatus }) => {
  const [msg, setMsg] = useState<Msg>(null);
  const { busy, run } = useAction(setMsg);
  const s = status.settings;
  return (
    <div className="space-y-4">
      {msg && <Notice kind={msg.kind} onClose={() => setMsg(null)}>{msg.text}</Notice>}
      <Card
        title="What the AI handles"
        actions={
          <Button kind={s.autoReplyPaused ? 'success' : 'danger'} disabled={busy} onClick={() => run(() => textsApi.saveSettings({ autoReplyPaused: !s.autoReplyPaused }).then(onStatus))}>
            {s.autoReplyPaused ? 'Resume auto-replies' : 'Pause all auto-replies'}
          </Button>
        }
      >
        <p className="text-xs text-slate-400 mb-4">
          A type switches to <strong>Auto</strong> after at least {s.promoteAfter} decisions, if you sent {s.promoteAccuracy}% or more of its recent drafts
          without changes{s.autoPromote ? '' : ' and you turn it on (auto-switch is off in Setup)'}. Auto replies still wait for you when the AI is unsure.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-500 text-left">
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Sent as-is</th>
                <th className="py-2 pr-3">You edited</th>
                <th className="py-2 pr-3">Auto-sent</th>
                <th className="py-2 pr-3 min-w-[140px]">Progress</th>
                <th className="py-2">Mode</th>
              </tr>
            </thead>
            <tbody>
              {status.categories.map(c => {
                const progress = Math.min(100, Math.round((c.recent.length / s.promoteAfter) * 100));
                return (
                  <tr key={c.key} className="border-t border-slate-800">
                    <td className="py-2 pr-3 text-slate-200">{c.label}</td>
                    <td className="py-2 pr-3 text-emerald-300">{c.approved}</td>
                    <td className="py-2 pr-3 text-amber-300">{c.edited}</td>
                    <td className="py-2 pr-3 text-cyan-300">{c.autoSent}</td>
                    <td className="py-2 pr-3">
                      {c.locked ? (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> always asks you</span>
                      ) : (
                        <div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${c.accuracy >= s.promoteAccuracy ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {c.recent.length}/{s.promoteAfter} decisions · {c.accuracy}% as-is
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {c.mode === 'auto' ? <Badge value="running" label="Auto" /> : c.ready ? <Badge value="paused" label="Ready" /> : <Badge value="draft" label="You approve" />}
                        {!c.locked && (
                          <Button small disabled={busy} onClick={() => run(() => textsApi.setMode(c.key, c.mode === 'auto' ? 'review' : 'auto').then(onStatus))}>
                            {c.mode === 'auto' ? 'Back to approve' : 'Turn on auto'}
                          </Button>
                        )}
                        {(c.approved + c.edited) > 0 && (
                          <Button small disabled={busy} onClick={() => confirm(`Forget what the AI learned about "${c.label}"?`) && run(() => textsApi.resetCategory(c.key).then(onStatus))}>
                            Reset
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ── Setup ───────────────────────────────────────────────────────────────────
const SetupPanel: React.FC<{ status: TextStatus; onStatus: (s: TextStatus) => void; reload: () => void }> = ({ status, onStatus, reload }) => {
  const [form, setForm] = useState<TextSettings>(status.settings);
  const [testText, setTestText] = useState('Hi, do you have anything open Thursday afternoon?');
  const [msg, setMsg] = useState<Msg>(null);
  const { busy, run } = useAction(setMsg);
  const set = (p: Partial<TextSettings>) => setForm({ ...form, ...p });

  const steps: [boolean, React.ReactNode][] = [
    [status.gatewayConfigured, <>On the Android phone that runs Google Messages, install <strong>SMS Gateway for Android</strong> (free, from sms-gate.app or Google Play) and give it SMS permission.</>],
    [status.gatewayConfigured, <>In the app, turn on <strong>Cloud server</strong> and tap Online. Copy the username and password it shows into <code>SMS_GATEWAY_USER</code> and <code>SMS_GATEWAY_PASSWORD</code> (Render → Environment, or your <code>.env</code>).</>],
    [status.signingKeySet, <>In the app open <strong>Settings → Webhooks</strong>, copy the <strong>Signing key</strong> into <code>SMS_GATEWAY_SIGNING_KEY</code>. This proves texts really come from your phone.</>],
    [!!status.webhookUrl && status.webhookUrl.startsWith('https://'), <>This server needs a public https address{status.webhookUrl ? `: ${status.webhookUrl}` : ' (set PUBLIC_BASE_URL)'}.</>],
  ];

  return (
    <div className="space-y-4">
      {msg && <Notice kind={msg.kind} onClose={() => setMsg(null)}>{msg.text}</Notice>}
      <Card title="1. Connect your phone">
        <ol className="space-y-2 text-sm text-slate-300 list-decimal pl-5">
          {steps.map(([ok, label], i) => (
            <li key={i} className={ok ? 'text-slate-300' : 'text-slate-400'}>{ok && <span className="text-emerald-400">✓ </span>}{label}</li>
          ))}
          <li>
            Click <strong>Connect</strong> so the app sends new texts here.{' '}
            <Button kind="primary" small disabled={busy || !status.gatewayConfigured} onClick={() => run(() => textsApi.connect(), r => (r.result === 'exists' ? 'Already connected.' : 'Connected! Text your number from another phone to try it.'))}>
              Connect
            </Button>
          </li>
        </ol>
        <p className="text-[11px] text-slate-500 mt-3">
          Keep the phone charged, on Wi-Fi or data, and turn off battery optimization for the gateway app. Replies go out from your own number and show in
          Google Messages like any other text.
        </p>
      </Card>

      <Card title="2. Teach it about your business" actions={<Button kind="primary" disabled={busy} onClick={() => run(() => textsApi.saveSettings(form).then(onStatus), 'Saved')}>Save</Button>}>
        <div className="space-y-4">
          <Field label="Prices, services, parking, policies, common questions" hint="The AI only quotes what's written here. Business name, address and hours come from Outbound Dialer → Settings.">
            <TextArea rows={8} value={form.businessInfo} onChange={e => set({ businessInfo: e.target.value })} placeholder={'Haircut $35 (30 min)\nColor from $90\nFree parking behind the building\n24 hours notice to cancel'} className="!font-sans" />
          </Field>
          <Field label="Sign-off added to AI replies (optional)">
            <Input value={form.signature} onChange={e => set({ signature: e.target.value })} placeholder="- Maria" />
          </Field>
          <Toggle checked={form.enabled} onChange={v => set({ enabled: v })} label="Write AI drafts for new texts" />
          <Toggle checked={form.autoPromote} onChange={v => set({ autoPromote: v })} label="Switch a type to auto-reply by itself once it has earned it" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Decisions needed first">
              <Input type="number" min={3} max={20} value={form.promoteAfter} onChange={e => set({ promoteAfter: +e.target.value })} />
            </Field>
            <Field label="Sent without changes (%)">
              <Input type="number" min={50} max={100} value={form.promoteAccuracy} onChange={e => set({ promoteAccuracy: +e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="3. Try it (nothing is sent)">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={testText} onChange={e => setTestText(e.target.value)} />
          <Button kind="primary" disabled={busy || !testText.trim()} onClick={() => run(() => textsApi.test(testText).then(reload), 'Test draft added to Review.')}>
            Send test text
          </Button>
        </div>
      </Card>
    </div>
  );
};

// ── Shell ───────────────────────────────────────────────────────────────────
export const TextAssistant: React.FC = () => {
  const [section, setSection] = useState<Section>('review');
  const [status, setStatus] = useState<TextStatus | null>(null);
  const [drafts, setDrafts] = useState<TextDraft[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const s = await textsApi.status();
      setStatus(s);
      if (!s.locked) setDrafts(await textsApi.drafts());
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (status && !status.gatewayConfigured && section === 'review' && drafts.length === 0) setSection('setup');
  }, [status?.gatewayConfigured]);

  const sections: [Section, string, React.ElementType][] = [
    ['review', `Review${drafts.length ? ` (${drafts.length})` : ''}`, Inbox],
    ['threads', 'Conversations', MessagesSquare],
    ['learning', 'Learning', GraduationCap],
    ['setup', 'Setup', Settings],
  ];

  return (
    <div className="space-y-5">
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-black text-white uppercase font-display tracking-wider flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-cyan-400" />
          AI Text Assistant
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Answers texts to your own number (Google Messages). You approve its drafts; as it learns a type of text, it starts replying to that type on its own.
        </p>
      </div>

      {error && <Notice kind="error">{error}</Notice>}
      {status?.locked && <Notice kind="error">Set <code>ADMIN_PASSWORD</code> to unlock the text assistant. It can send texts from your phone.</Notice>}

      {status && !status.locked && (
        <>
          <div className="flex gap-1 overflow-x-auto">
            {sections.map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold whitespace-nowrap ${
                  section === key ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          {section === 'review' && <ReviewPanel drafts={drafts} reload={load} status={status} />}
          {section === 'threads' && <ThreadsPanel />}
          {section === 'learning' && <LearningPanel status={status} onStatus={setStatus} />}
          {section === 'setup' && <SetupPanel status={status} onStatus={setStatus} reload={load} />}
        </>
      )}
    </div>
  );
};
