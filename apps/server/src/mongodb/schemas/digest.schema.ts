// src/mongodb/schemas/digest-history.schema.ts
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type DigestSummary } from '@repo/shared-types/globals';
import { Document, Types } from 'mongoose';

export type DigestHistoryDocument = DigestHistory & Document;

@Schema({ timestamps: true })
export class DigestHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Buffer })
  content: Buffer;

  @Prop({ required: true, type: Buffer })
  iv: Buffer;

  @Prop({ required: true, type: Buffer })
  authTag: Buffer;

  @Prop({ required: true, default: Date.now })
  sentAt: Date;

  @Prop({
    type: [String],
    enum: ['email', 'push', 'web', 'slack'],
    required: true,
  })
  deliveryChannels: ('email' | 'push' | 'web' | 'slack')[];

  @Prop({ default: false })
  opened?: boolean;

  @Prop(
    raw({
      totalItems: { type: Number },
      bySource: { type: Object },
      byPriority: { type: Object },
      integrations: { type: [String] },
    }),
  )
  summary: DigestSummary;
}

export const DigestHistorySchema = SchemaFactory.createForClass(DigestHistory);

DigestHistorySchema.index({ userId: 1, sentAt: -1 });
DigestHistorySchema.index({ deliveryChannels: 1 });
DigestHistorySchema.index({ opened: 1 });
