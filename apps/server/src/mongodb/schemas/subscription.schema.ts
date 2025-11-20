import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document<Types.ObjectId>;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true, select: false })
  paystackSubscriptionCode: string;

  @Prop({ required: true, select: false })
  paystackEmailToken: string;

  @Prop({
    enum: ['pro_monthly', 'free'],
    default: 'free',
  })
  plan: string;

  @Prop({
    enum: ['active', 'canceled', 'past_due', 'incomplete', 'pending'],
    default: 'active',
  })
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'pending';

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop()
  trialEndsAt?: Date;

  @Prop({ default: false })
  isFirstTrial: boolean;

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
