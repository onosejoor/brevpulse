export type GeminiInputs = {
  rawData: any;
  plan: 'free' | 'pro';
  period: 'daily' | 'weekly';
  timezone?: string;
  locale?: string;
  preferences?: { maxItemsPerSource?: number };
};

// TypeScript type definitions for the Brevpulse payload
export type DigestSource = 'gmail' | 'calendar' | 'github' | 'slack' | 'figma';
export type DigestPriority = 'high' | 'medium' | 'low';
export type DigestPlan = 'free' | 'pro';
export type DeliveryChannel = 'email' | 'push' | 'web' | 'slack';
export type ActionType = 'primary' | 'secondary';

export interface DigestAction {
  label: string;
  url: string;
  type?: ActionType;
}

export interface DigestItemMetadata {
  sender?: string;
  eventTime?: string;
  prAuthor?: string;
  channel?: string;
  fileName?: string;
  status?: string;
  [key: string]: any;
}

export interface DigestItem {
  source: DigestSource;
  priority: DigestPriority;
  title: string;
  description?: string;
  count: number;
  metadata?: DigestItemMetadata;
  actions?: DigestAction[];
}

export interface DigestSummary {
  totalItems: number;
  bySource: Record<DigestSource, number>;
  byPriority: Record<DigestPriority, number>;
  integrations: DigestSource[];
}

export interface DigestMetadata {
  theme?: 'light' | 'dark';
  locale?: string;
  timezone?: string;
}

// DB fields (userId, digestId, sentAt, etc.) are added when persisting
export interface BrevpulsePayload {
  period?: 'daily' | 'weekly';
  items: DigestItem[];
  summary: DigestSummary;
  plan?: DigestPlan;
  metadata?: DigestMetadata;
}

export interface BrevpulseDigestRecord extends BrevpulsePayload {
  userId: string;
  digestId: string;
  sentAt: string;
  deliveryChannels: DeliveryChannel[];
  opened?: boolean;
}
