import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { GmailConnectService } from './services/gmail.service';
import { UserModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/mongodb/schemas/user.schema';
import { RedisModule } from '../redis/redis.module';
import { CustomJwtModule } from '@/modules/jwt/jwt.module';
import { CalendarConnectService } from './services/calendar.service';
import { GitHubConnectService } from './services/github.service';

@Module({
  imports: [
    UserModule,
    CustomJwtModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RedisModule,
  ],
  providers: [
    GmailConnectService,
    CalendarConnectService,
    GitHubConnectService,
  ],
  controllers: [IntegrationsController],
  exports: [GmailConnectService, CalendarConnectService, GitHubConnectService],
})
export class IntegrationsModule {}
