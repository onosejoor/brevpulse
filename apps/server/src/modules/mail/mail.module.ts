import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtModule } from '@nestjs/jwt';
import { MailWorker } from 'src/workers/mail.worker';
import { DigestModule } from '../digest/digest.module';

@Module({
  providers: [MailService, MailWorker],
  imports: [JwtModule.register({ global: true }), DigestModule],
  exports: [MailService],
})
export class MailModule {}
