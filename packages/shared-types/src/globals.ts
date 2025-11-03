export type Status = "success" | "error";

export type DigestSource = "gmail" | "calendar" | "github" | "slack" | "figma";
export type DigestPriority = "high" | "medium" | "low";
export type DigestPlan = "free" | "pro";
export type DeliveryChannel = "email" | "push" | "web" | "slack";
export type ActionType = "primary" | "secondary";

export interface DigestAction {
  url: string;
  type?: ActionType;
  label?: string;
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
  actions?: DigestAction[];
}

export interface DigestSummary {
  totalItems: number;
  bySource: Record<DigestSource, number>;
  byPriority: Record<DigestPriority, number>;
  integrations: DigestSource[];
}

export interface DigestPayload {
  period?: "daily" | "weekly";
  items: DigestItem[];
  summary: DigestSummary;
  plan?: DigestPlan;
}
