import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserTokenService } from './common/user-token.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from '@/mongodb/schemas/user.schema';
import { UserSchema } from '@/mongodb/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserTokenService],
})
export class UsersModule {}
