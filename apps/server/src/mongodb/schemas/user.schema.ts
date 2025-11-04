import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import argon2 from 'argon2';
import crypto from 'crypto';
import { UserTokenClass } from './user_token.schema';

export type UserDocument = User & Document;

export type UserPreferences = {
  deliveryTime: string;
  timezone?: string;
  filters?: { keywords?: string[] };
  deliveryChannels?: ('email' | 'push' | 'web' | 'slack')[];
};

export type UserToken = {
  _id: Types.ObjectId;
  provider: 'gmail' | 'outlook' | 'slack' | 'github' | 'figma' | 'calendar';
  accessToken: string;
  refreshToken?: string;
  expiryDate?: Date;
  /**
   * If true the provider token is disabled for notifications (won't be used to send digests/notifications)
   * Allows users to temporarily mute a provider without deleting the token.
   */
  isDisabled?: boolean;
};
@Schema({ timestamps: true, _id: true })
export class User {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  name: string;

  @Prop({ default: false })
  email_verified: boolean;

  @Prop({ required: false, default: '' })
  avatar: string;

  @Prop({ type: Buffer, select: false })
  encryptionKey?: Buffer;

  @Prop({ required: false, select: false })
  password?: string;
  @Prop({
    type: [UserTokenClass],
    default: [],
    validate: {
      validator: (tokens: any[]) => tokens.length <= 10,
      message: 'Maximum 10 integrations allowed',
    },
  })
  tokens: UserToken[];

  @Prop(
    raw({
      deliveryTime: { type: String, default: '08:00' },
      filters: { type: Object },
      timezone: { type: String },
      deliveryChannels: {
        type: [String],
        enum: ['email', 'push', 'web', 'slack'],
        default: ['email'],
      },
    }),
  )
  preferences: UserPreferences;

  @Prop({ enum: ['free', 'pro'], default: 'free' })
  subscription: 'free' | 'pro';

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (!this.encryptionKey) {
    this.encryptionKey = crypto.randomBytes(32);
  }

  if (this.isModified('password') && this.password) {
    this.password = await argon2.hash(this.password);
  }

  next();
});

UserSchema.index({ 'tokens.provider': 1 });
UserSchema.index({ subscription: 1 });
