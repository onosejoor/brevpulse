import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CallbackError, Document } from 'mongoose';
import argon2 from 'argon2';

export type UserDocument = User & Document;

type UserPreferences = {
  deliveryTime?: string;
  filters?: { keywords?: string[] };
};

type UserToken = {
  provider: 'google' | 'outlook' | 'slack' | 'github' | 'figma';
  accessToken: string;
  refreshToken?: string | undefined;
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

  @Prop({ required: false, select: false })
  password: string;

  @Prop({
    select: false,
    type: [
      {
        provider: {
          type: String,
          required: true,
          enum: ['google', 'outlook', 'slack', 'github', 'figma'],
        },
        accessToken: { type: String, required: true, select: false },
        refreshToken: { type: String, select: false },
      },
    ],
    default: [],
    validate: {
      validator: (tokens: any[]) => tokens.length <= 10,
      message: 'Too many integrations connected (max 10)',
    },
  })
  tokens: UserToken[];

  @Prop({ type: Object, default: {} })
  preferences: UserPreferences;

  @Prop({ enum: ['free', 'pro'], default: 'free' })
  subscription: 'free' | 'pro';

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const hashedPassword = await argon2.hash(this.password);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

UserSchema.index({ 'tokens.provider': 1 });
