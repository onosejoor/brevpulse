import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'src/mongodb/schemas/user.schema';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Throttle } from '@nestjs/throttler';
import { throttlerOptions } from '@/utils/utils';

@Controller('user')
@UseGuards(AuthGuard)
@Throttle({ long: throttlerOptions.long })
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @HttpCode(200)
  findOne(@Req() req: UserRequest) {
    const { user } = req;

    return this.userService.findOne(user.id);
  }

  @Patch('me')
  @HttpCode(200)
  update(@Req() req: UserRequest, @Body() updateUserDto: Partial<User>) {
    const { user } = req;

    return this.userService.update(user.id, updateUserDto);
  }
}
