import { Controller, Get, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'src/mongodb/schemas/user.schema';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('user')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  findOne(@Req() req: UserRequest) {
    const { user } = req;

    return this.userService.findOne(user.id);
  }

  @Patch()
  update(@Req() req: UserRequest, @Body() updateUserDto: Partial<User>) {
    const { user } = req;

    return this.userService.update(user.id, updateUserDto);
  }
}
