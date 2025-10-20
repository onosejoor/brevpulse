import {
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Post,
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
import { jwtConstants } from 'src/utils/jwt-constants';

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
  async signinUser(
    @Body() signinDto: SigninUserDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { data, status, message } =
      await this.authService.signinUser(signinDto);

    if (status !== 'success') {
      throw new InternalServerErrorException(message);
    }

    const isProd = process.env.NODE_ENV === 'production';

    // Set refresh token cookie
    res.cookie('brevpulse_session_token', data!.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(jwtConstants.refresh.expiresAt),
    });

    // Set access token cookie
    res.cookie('brevpulse_access_token', data!.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(jwtConstants.access.expiresAt),
    });

    return { status, message };
  }
}
