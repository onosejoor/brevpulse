import { Module } from '@nestjs/common';
import { DigestController } from './digest.controller';
import { DigestService } from './digest.service';
import { RedisModule } from '../redis/redis.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [RedisModule, IntegrationsModule],
  controllers: [DigestController],
  providers: [DigestService],
})
export class DigestModule {}
