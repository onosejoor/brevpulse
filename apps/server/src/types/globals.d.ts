import { Request } from 'express';

declare global {
  type AuthTokenPayload = {
    email_verified: boolean | undefined;
    id: string;
    subscription: 'free' | 'pro';
  };

  interface UserRequest extends Request {
    user: AuthTokenPayload;
  }
}
