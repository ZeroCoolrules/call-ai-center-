// Texting from your own phone number through "SMS Gateway for Android"
// (https://sms-gate.app, free and open source).
//
// Google Messages has no API, so the gateway app runs on the same Android phone:
// it forwards every incoming text to our webhook and sends our replies from your
// SIM. Texts still show up in Google Messages as usual.
//
// Cloud mode (recommended): SMS_GATEWAY_URL is left blank and the app's
// "Cloud server" username/password go in SMS_GATEWAY_USER / SMS_GATEWAY_PASSWORD.
// Local mode: SMS_GATEWAY_URL=http://<phone-ip>:8080 with the "Local server" login.
import crypto from 'crypto';
import type { Request } from 'express';
import type { TextMessage } from '../src/types/texts';
import { db, newId, save } from './store';
import { normalizePhone } from './compliance';
import { sendSms, twilioConfigured } from './twilio';

const CLOUD_URL = 'https://api.sms-gate.app/3rdparty/v1';
const BASE = (process.env.SMS_GATEWAY_URL || CLOUD_URL).replace(/\/+$/, '');
const USER = process.env.SMS_GATEWAY_USER || '';
const PASSWORD = process.env.SMS_GATEWAY_PASSWORD || '';
const SIGNING_KEY = process.env.SMS_GATEWAY_SIGNING_KEY || '';
// Cloud and private servers use /3rdparty/v1/messages; the phone's own local server uses /message.
const CLOUD_STYLE = BASE.includes('/3rdparty/');

export const WEBHOOK_PATH = '/api/webhooks/sms-gateway';

export function gatewayConfigured(): boolean {
  return !!(USER && PASSWORD);
}

export function gatewayMode(): 'cloud' | 'local' | 'none' {
  if (!gatewayConfigured()) return 'none';
  return CLOUD_STYLE ? 'cloud' : 'local';
}

export function signingKeySet(): boolean {
  return !!SIGNING_KEY;
}

async function gatewayRequest(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<any> {
  if (!gatewayConfigured()) throw new Error('Phone gateway is not set up (SMS_GATEWAY_USER / SMS_GATEWAY_PASSWORD missing)');
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${USER}:${PASSWORD}`).toString('base64')}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) throw new Error(`Phone gateway ${res.status}: ${data.message || text.slice(0, 200)}`);
  return data;
}

export async function sendGatewaySms(to: string, text: string): Promise<{ id: string }> {
  const data = await gatewayRequest('POST', CLOUD_STYLE ? '/messages' : '/message', {
    textMessage: { text },
    phoneNumbers: [to],
  });
  return { id: String(data.id || '') };
}

// Points the gateway app's "sms:received" webhook at this server (skips it if already there).
export async function registerWebhook(url: string): Promise<'added' | 'exists'> {
  const hooks: any[] = await gatewayRequest('GET', '/webhooks').catch(() => []);
  if (Array.isArray(hooks) && hooks.some(h => h.url === url && h.event === 'sms:received')) return 'exists';
  await gatewayRequest('POST', '/webhooks', { url, event: 'sms:received' });
  return 'added';
}

// The app signs each webhook: hex HMAC-SHA256 of (raw body + X-Timestamp) with
// the signing key shown in the app under Settings → Webhooks.
export function gatewaySignatureValid(req: Request): boolean {
  if (!SIGNING_KEY) return false;
  const signature = String(req.get('x-signature') || '');
  const timestamp = String(req.get('x-timestamp') || '');
  const raw: Buffer | undefined = (req as any).rawBody;
  if (!signature || !timestamp || !raw) return false;
  // Reject replays older than 5 minutes (the app's retries are re-signed).
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = crypto.createHmac('sha256', SIGNING_KEY).update(Buffer.concat([raw, Buffer.from(timestamp)])).digest('hex');
  const a = Buffer.from(signature.toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── Conversation log shared by the gateway, the AI and the dashboard ────────
export function recordText(m: Omit<TextMessage, 'id' | 'at'>): TextMessage {
  const msg: TextMessage = { id: newId('txt'), at: new Date().toISOString(), ...m, phone: normalizePhone(m.phone) || m.phone };
  db.texts.messages.push(msg);
  save();
  return msg;
}

export function textingConfigured(): boolean {
  return gatewayConfigured() || twilioConfigured();
}

// Sends a text from your own number when the phone gateway is set up, otherwise
// from the Twilio number. Gateway texts are logged in the AI Text Assistant.
export async function sendText(to: string, body: string, by: TextMessage['by'] = 'system'): Promise<void> {
  if (gatewayConfigured()) {
    try {
      await sendGatewaySms(to, body);
      recordText({ phone: to, direction: 'out', text: body, by });
    } catch (err: any) {
      recordText({ phone: to, direction: 'out', text: body, by, failed: err.message });
      throw err;
    }
    return;
  }
  await sendSms(to, body);
}
