export type Events =
  | 'subscription.create'
  | 'subscription.disable'
  | 'subscription.not_renew'
  | 'invoice.update'
  | 'invoice.payment_failed'
  | 'charge.success';

// --- Specific Event Data Interfaces ---

export interface PaystackSubscription {
  subscription_code: string;
  email_token: string;
  status: string;
  amount: number;
  cron_expression: string;
  next_payment_date: string;
  open_invoice: string;
  createdAt: string;
  plan: {
    name: string;
    plan_code: string;
    description: string | null;
    amount: number;
    interval: string;
    currency: string;
  };
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    metadata: any;
    customer_code: string;
  };
  created_at: string;
}

export interface PaystackInvoice {
  domain: string;
  invoice_code: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: string;
  paid: boolean;
  paid_at: string;
  description: string | null;
  authorization: any;
  subscription: {
    status: string;
    subscription_code: string;
    amount: number;
  };
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: any;
  };
  transaction: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
  };
  created_at: string;
  next_payment_date: string;
}

export interface PaystackCharge {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: {
    user_id?: string;
    custom_fields?: any[];
    [key: string]: any;
  };
  log: any;
  fees: any;
  fees_split: any;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
    account_name: string | null;
  };
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: any;
    risk_action: string;
  };
  plan: any;
  subaccount: any;
  split: any;
  order_id: string | null;
  paidAt: string;
  requested_amount: number;
  pos_transaction_data: any;
  source: any;
  fees_breakdown: any;
  subscription?: {
    subscription_code: string;
    email_token: string;
    amount: number;
    cron_expression: string;
    next_payment_date: string;
    open_invoice: string;
  };
}

// --- Discriminated Union for Strong Typing ---

export type PaystackEvent =
  | { event: 'subscription.create'; data: PaystackSubscription }
  | { event: 'subscription.disable'; data: PaystackSubscription }
  | { event: 'subscription.not_renew'; data: PaystackSubscription }
  | { event: 'invoice.update'; data: PaystackInvoice }
  | { event: 'invoice.payment_failed'; data: PaystackInvoice }
  | { event: 'charge.success'; data: PaystackCharge };

export type ExtractEvent<T extends Events> = Extract<
  PaystackEvent,
  { event: T }
>['data'];
