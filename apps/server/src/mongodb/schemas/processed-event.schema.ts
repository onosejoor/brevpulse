import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProcessedEventDocument = Document<Types.ObjectId, any, any> &
  ProcessedEvent;

@Schema({ timestamps: true })
export class ProcessedEvent {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  processedAt: Date = new Date();
}

export const ProcessedEventSchema =
  SchemaFactory.createForClass(ProcessedEvent);
