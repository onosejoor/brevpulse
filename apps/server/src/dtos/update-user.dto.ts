import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().url().optional(),
  preferences: z
    .object({
      deliveryTime: z.string().optional(),
      filters: z
        .object({
          keywords: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
