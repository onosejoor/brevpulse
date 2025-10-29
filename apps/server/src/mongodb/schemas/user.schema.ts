import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import argon2 from 'argon2';
import crypto from 'crypto';

export type UserDocument = User & Document;

type UserPreferences = {
  deliveryTime?: string;
  filters?: { keywords?: string[] };
  deliveryChannels?: ('email' | 'push' | 'web' | 'slack')[];
};

export type UserToken = {
  provider: 'gmail' | 'outlook' | 'slack' | 'github' | 'figma';
  accessToken: string;
  refreshToken?: string;
  expiryDate?: Date;
};
@Schema({ timestamps: true })
export class User {
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
    type: [
      raw({
        provider: {
          type: String,
          required: true,
          enum: ['gmail', 'outlook', 'slack', 'github', 'figma'],
        },
        accessToken: { type: String, required: true, select: false },
        refreshToken: { type: String, select: false },
        expiryDate: { type: Date },
      }),
    ],
    default: [],
    validate: {
      validator: (tokens: any[]) => tokens.length <= 10,
      message: 'Maximum 10 integrations allowed',
    },
  })
  tokens: UserToken[];

  @Prop(
    raw({
      deliveryTime: { type: String },
      filters: { type: Object },
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
