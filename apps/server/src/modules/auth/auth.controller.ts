import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { type SigninUserDTO, type CreateUserDto } from 'src/dtos/auth.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  createUserSchema,
  signinUserSchema,
} from '@repo/shared-types/auth.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getUsers() {
    return this.authService.getUsers();
  }

  @Post('signup')
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createUserSchema))
  createUser(@Body() createDto: CreateUserDto) {
    return this.authService.createUser(createDto);
  }

  @Post('signin')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(signinUserSchema))
  signinUser(@Body() signinDto: SigninUserDTO) {
    return this.authService.signinUser(signinDto);
  }
}
