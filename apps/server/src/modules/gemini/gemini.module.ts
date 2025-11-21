import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
