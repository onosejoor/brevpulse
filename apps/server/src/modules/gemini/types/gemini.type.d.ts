export type GeminiInputs = {
  rawData: any;
  plan: 'free' | 'pro';
  period: 'daily' | 'weekly';
  timezone?: string;
  locale?: string;
};
