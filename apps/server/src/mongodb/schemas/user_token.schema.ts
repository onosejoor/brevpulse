import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserToken } from './user.schema';

@Schema({ _id: true })
export class UserTokenClass {
  @Prop({
    type: String,
    required: true,
    enum: ['gmail', 'outlook', 'slack', 'github', 'figma', 'calendar'],
  })
  provider: UserToken['provider'];

  @Prop({ required: true, select: false })
  accessToken: string;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop()
  expiryDate?: Date;

  @Prop({ default: false })
  isDisabled?: boolean;
}

export const UserTokenSchema = SchemaFactory.createForClass(UserTokenClass);
