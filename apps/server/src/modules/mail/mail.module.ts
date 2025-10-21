import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [MailService],
  imports: [JwtModule.register({ global: true })],
  exports: [MailService],
})
export class MailModule {}
