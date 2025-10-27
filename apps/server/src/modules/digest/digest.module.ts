import { Module } from '@nestjs/common';
import { DigestController } from './digest.controller';
import { DigestService } from './digest.service';
import { RedisModule } from '../redis/redis.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { GeminiModule } from '../gemini/gemini.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/mongodb/schemas/user.schema';

@Module({
  imports: [
    RedisModule,
    IntegrationsModule,
    GeminiModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [DigestController],
  providers: [DigestService],
})
export class DigestModule {}
