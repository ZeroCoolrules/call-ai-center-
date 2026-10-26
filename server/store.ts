// Small JSON-file database for the dialer, reminders and scripts.
//
// Everything lives in one file (DATA_DIR/outbound.json). Writes are batched and
// atomic (write temp file, then rename) so a crash never leaves a half-written
// file. On Render, point DATA_DIR at a persistent disk or the data resets on
// every deploy/restart.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  AppSettings,
  Appointment,
  CallRecord,
  CallScript,
  Campaign,
  Contact,
  DialerSettings,
  DncEntry,
} from '../src/types/outbound';
import type { CategoryStats, TextDraft, TextExample, TextMessage, TextSettings } from '../src/types/texts';
import { DEFAULT_SCRIPTS } from './scripts';

export interface Db {
  version: 1;
  settings: AppSettings;
  campaigns: Campaign[];
  contacts: Contact[];
  scripts: CallScript[];
  appointments: Appointment[];
  calls: CallRecord[];
  dnc: DncEntry[];
  google: { refreshToken?: string; connectedAt?: string };
  texts: TextsData;
}

// AI Text Assistant (texts to your own number via the Android gateway app).
export interface TextsData {
  settings: TextSettings;
  messages: TextMessage[];
  drafts: TextDraft[];
  categories: Partial<Record<string, CategoryStats>>;
  examples: TextExample[];
  seen: string[]; // gateway message ids already handled (the app retries)
}

const MAX_CALLS_KEPT = 3000;
const MAX_TEXTS_KEPT = 5000;
const MAX_DRAFTS_KEPT = 1000;

export const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const DB_FILE = path.join(DATA_DIR, 'outbound.json');

export const DEFAULT_DIALER: DialerSettings = {
  maxConcurrentCalls: 1,
  delayAfterCallSeconds: 15,
  maxAttempts: 3,
  retryDelayMinutes: 60,
  callingHoursStart: 9,
  callingHoursEnd: 20,
  callingDays: [1, 2, 3, 4, 5, 6],
  timezone: 'America/New_York',
  unknownTimezoneMode: 'strict',
  machineDetection: true,
  leaveVoicemail: true,
  ringTimeoutSeconds: 25,
};

function defaultSettings(): AppSettings {
  return {
    businessName: process.env.BUSINESS_NAME || 'our office',
    businessAddress: '',
    agentPhone: process.env.AGENT_PHONE || process.env.HUMAN_FORWARD_NUMBER || '',
    callerId: '',
    businessHours: { startHour: 9, endHour: 17, days: [1, 2, 3, 4, 5], timezone: 'America/New_York' },
    defaultAppointmentMinutes: 30,
    appointmentsPerSlot: 1,
    reminderOffsetsHours: [24, 2],
    reminderChannel: 'sms',
    staticMeetLink: '',
    addAllToCalendar: false,
    inboundScriptId: '',
    defaultDialer: { ...DEFAULT_DIALER },
  };
}

export const DEFAULT_TEXT_SETTINGS: TextSettings = {
  enabled: true,
  autoReplyPaused: false,
  autoPromote: true,
  promoteAfter: 10,
  promoteAccuracy: 90,
  businessInfo: '',
  signature: '',
};

function freshTexts(): TextsData {
  return { settings: { ...DEFAULT_TEXT_SETTINGS }, messages: [], drafts: [], categories: {}, examples: [], seen: [] };
}

function freshDb(): Db {
  return {
    version: 1,
    settings: defaultSettings(),
    campaigns: [],
    contacts: [],
    scripts: DEFAULT_SCRIPTS.map(s => ({ ...s, updatedAt: new Date().toISOString() })),
    appointments: [],
    calls: [],
    dnc: [],
    google: {},
    texts: freshTexts(),
  };
}

function load(): Db {
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const base = freshDb();
    return {
      ...base,
      ...raw,
      settings: { ...base.settings, ...raw.settings, defaultDialer: { ...DEFAULT_DIALER, ...raw.settings?.defaultDialer } },
      google: raw.google || {},
      texts: { ...base.texts, ...raw.texts, settings: { ...DEFAULT_TEXT_SETTINGS, ...raw.texts?.settings } },
    };
  } catch (err: any) {
    if (err.code !== 'ENOENT') console.error('[store] could not read', DB_FILE, err.message);
    return freshDb();
  }
}

export const db: Db = load();

let saveTimer: NodeJS.Timeout | null = null;

function writeNow() {
  saveTimer = null;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (db.calls.length > MAX_CALLS_KEPT) db.calls.splice(0, db.calls.length - MAX_CALLS_KEPT);
    const t = db.texts;
    if (t.messages.length > MAX_TEXTS_KEPT) t.messages.splice(0, t.messages.length - MAX_TEXTS_KEPT);
    if (t.drafts.length > MAX_DRAFTS_KEPT) {
      const extra = t.drafts.length - MAX_DRAFTS_KEPT;
      const old = new Set(t.drafts.filter(d => d.status !== 'pending').slice(0, extra));
      t.drafts = t.drafts.filter(d => !old.has(d));
    }
    if (t.seen.length > 500) t.seen.splice(0, t.seen.length - 500);
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE);
  } catch (err: any) {
    console.error('[store] save failed:', err.message);
  }
}

// Call after any change. Saves within half a second.
export function save() {
  if (!saveTimer) saveTimer = setTimeout(writeNow, 500);
}

export function flush() {
  if (saveTimer) clearTimeout(saveTimer);
  writeNow();
}

process.on('SIGTERM', () => {
  flush();
  process.exit(0);
});
process.on('SIGINT', () => {
  flush();
  process.exit(0);
});

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

// On Render the app folder is wiped on every deploy/restart, so data is only
// safe when DATA_DIR points at a mounted disk outside it. Elsewhere (your own
// computer, a VM) the local folder is fine.
export function storageLooksPersistent(): boolean {
  if (!process.env.RENDER) return true;
  return !DATA_DIR.startsWith(process.cwd());
}
