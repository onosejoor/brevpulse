import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Subscription } from './subscription.schema';

export type TransactionDocument = Transaction &
  Document<Types.ObjectId, any, any>;

@Schema({ timestamps: true })
export class Transaction {
  // Link to the user who paid
  @Prop({ required: true, ref: 'User' })
  user: Types.ObjectId;

  // Paystack's unique transaction reference (from the charge.success payload)
  @Prop({ required: true, unique: true, index: true })
  reference: string;

  // Optional link to the current subscription (if this transaction is a recurring payment)
  @Prop({ ref: Subscription.name, index: true })
  subscription?: Types.ObjectId;

  // Amount paid (in kobo/cent)
  @Prop({ required: true })
  amountPaidKobo: number; // e.g., 400000 for ₦4,000

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop({
    enum: ['success', 'abandoned', 'failed', 'reversed'],
    default: 'success',
  })
  status: string;

  // Payment details from the authorization object
  @Prop()
  authorizationCode?: string; // The token for future charges

  @Prop()
  cardType?: string;

  @Prop()
  bank?: string;

  @Prop()
  channel?: string; // e.g., 'card', 'bank_transfer'
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes for Transaction Model
TransactionSchema.index({ user: 1, createdAt: -1 }); // For fetching a user's billing history
