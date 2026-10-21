// AI Text Assistant: texts that arrive on your own phone number (Google Messages)
// through the SMS Gateway for Android app, AI drafts, and what it has learned.

export const TEXT_CATEGORIES = [
  'booking',
  'reschedule',
  'cancel',
  'hours',
  'location',
  'pricing',
  'services',
  'thanks',
  'other',
  'urgent',
] as const;

export type TextCategory = (typeof TEXT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<TextCategory, string> = {
  booking: 'New booking',
  reschedule: 'Reschedule',
  cancel: 'Cancel',
  hours: 'Hours / open?',
  location: 'Address & directions',
  pricing: 'Prices',
  services: 'Services offered',
  thanks: 'Thanks / OK / see you',
  other: 'Anything else',
  urgent: 'Upset, urgent or wants a person',
};

// These always wait for you, no matter how well the AI does on them.
export const NEVER_AUTO: TextCategory[] = ['other', 'urgent'];

export interface TextMessage {
  id: string;
  phone: string;
  direction: 'in' | 'out';
  text: string;
  at: string;
  by?: 'you' | 'ai-approved' | 'ai-auto' | 'system';
  failed?: string;
  test?: boolean;
}

export type DraftStatus = 'pending' | 'sent' | 'dismissed' | 'superseded';

export interface TextDraft {
  id: string;
  phone: string;
  name?: string;
  inboundText: string;
  category: TextCategory;
  confidence: number;
  draft: string;
  book?: string; // local "YYYY-MM-DDTHH:MM" the AI wants to book when this is sent
  aiFailed?: boolean;
  status: DraftStatus;
  createdAt: string;
  resolvedAt?: string;
  finalText?: string;
  edited?: boolean;
  note?: string; // why it is waiting for you, or what went wrong
  test?: boolean;
}

export interface CategoryStats {
  mode: 'review' | 'auto';
  approved: number; // sent without changes
  edited: number; // you changed the draft before sending
  dismissed: number;
  autoSent: number;
  recent: boolean[]; // last 20 decisions, true = sent unchanged
  promotedAt?: string;
}

export interface TextExample {
  category: TextCategory;
  inbound: string;
  reply: string;
  at: string;
}

export interface TextSettings {
  enabled: boolean; // AI writes drafts for new texts
  autoReplyPaused: boolean; // master switch: nothing is sent without you
  autoPromote: boolean; // switch a type to auto-reply by itself once it has earned it
  promoteAfter: number; // decisions needed before a type can go automatic
  promoteAccuracy: number; // % of those sent without changes
  businessInfo: string; // prices, services, parking, policies... the AI answers only from this
  signature: string; // optional sign-off added to AI replies
}

export interface CategoryView extends CategoryStats {
  key: TextCategory;
  label: string;
  accuracy: number; // 0-100 over `recent`
  ready: boolean; // earned auto-reply but auto-promote is off
  locked: boolean; // in NEVER_AUTO
}

export interface ThreadSummary {
  phone: string;
  name?: string;
  last: TextMessage;
  pending: number;
}

export interface TextStatus {
  gatewayConfigured: boolean;
  gatewayMode: 'cloud' | 'local' | 'none';
  signingKeySet: boolean;
  webhookUrl: string;
  publicUrl: string;
  locked: boolean;
  settings: TextSettings;
  categories: CategoryView[];
  pending: number;
}
