// src/mongodb/schemas/digest-history.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DigestDocument = Digest & Document;

@Schema({ timestamps: true })
export class Digest {
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
}

export const DigestSchema = SchemaFactory.createForClass(Digest);

DigestSchema.index({ userId: 1, sentAt: -1 });
DigestSchema.index({ deliveryChannels: 1 });
DigestSchema.index({ opened: 1 });
