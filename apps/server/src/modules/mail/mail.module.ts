import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtModule } from '@nestjs/jwt';
import { MailWorker } from 'src/workers/mail.worker';

@Module({
  providers: [MailService, MailWorker],
  imports: [JwtModule.register({ global: true })],
  exports: [MailService],
})
export class MailModule {}
