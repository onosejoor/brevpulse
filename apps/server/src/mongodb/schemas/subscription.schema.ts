import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true })
  paystackSubscriptionCode: string;

  @Prop({ required: true })
  paystackEmailToken: string;

  @Prop({
    enum: ['pro_monthly', 'free'],
    default: 'free',
  })
  plan: string;

  @Prop({
    enum: ['active', 'canceled', 'past_due', 'incomplete', 'trialing'],
    default: 'active',
  })
  status: string;

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop()
  trialEndsAt?: Date;

  @Prop({ default: false })
  isFirstTrial: boolean;

  @Prop({ default: 0 })
  amountPaidKobo: number; // ₦4,000 → 400000

  @Prop()
  canceledAt?: Date;

  @Prop()
  endedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes
SubscriptionSchema.index({ user: 1 }, { unique: true }); // one active sub per user
SubscriptionSchema.index({ paystackSubscriptionCode: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 }); // for cron cleanup
