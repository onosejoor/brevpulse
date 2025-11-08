import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import type { NotificationType } from '@/mongodb/schemas/notification.schema';

export class CreateNotificationDto {
  @IsNotEmpty()
  type: NotificationType;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsUrl()
  link?: string;
}
