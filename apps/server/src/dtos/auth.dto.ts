import { z } from 'zod';
import {
  createUserSchema,
  signinUserSchema,
} from '@repo/shared-types/auth.type';

export type CreateUserDto = z.infer<typeof createUserSchema>;

export type SigninUserDTO = z.infer<typeof signinUserSchema>;
