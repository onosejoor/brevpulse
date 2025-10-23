import {
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Post,
  Query,
  Res,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { type SigninUserDTO, type CreateUserDto } from 'src/dtos/auth.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  createUserSchema,
  signinUserSchema,
} from '@repo/shared-types/auth.type';
import { type Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createUserSchema))
  createUser(@Body() createDto: CreateUserDto) {
    return this.authService.createUser(createDto);
  }

  @Get('verify-email')
  @HttpCode(200)
  async verifyEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { data, status, message } = await this.authService.verifyEmail(token);

    if (status !== 'success') {
      throw new InternalServerErrorException(message);
    }

    this.authService.sendCookies(res, data!);

    return {
      status: 'success',
      message,
    };
  }

  @Post('signin')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(signinUserSchema))
  async signinUser(
    @Body() signinDto: SigninUserDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { data, status, message } =
      await this.authService.signinUser(signinDto);

    if (status !== 'success' || !data) {
      throw new InternalServerErrorException(message);
    }

    this.authService.sendCookies(res, data);

    return { status, message };
  }
}
