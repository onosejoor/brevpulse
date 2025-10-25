import {
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Post,
  Query,
  Redirect,
  Req,
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
import { type Request, type Response } from 'express';
import { GoogleAuthService } from './google.service';
import { jwtConstants } from '@/utils/jwt-constants';
import { Throttle } from '@nestjs/throttler';
import { throttlerOptions } from '@/utils/utils';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private googleAuthService: GoogleAuthService,
  ) {}

  @Throttle({ short: throttlerOptions.short })
  @Post('signup')
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createUserSchema))
  createUser(@Body() createDto: CreateUserDto) {
    return this.authService.createUser(createDto);
  }

  @Get('refresh-token')
  @HttpCode(200)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { bp_rtoken } = req.cookies;

    const accessToken = await this.authService.refreshAccessToken(
      bp_rtoken as string,
    );

    const jwtTokens = jwtConstants();
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('bp_atoken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + jwtTokens.access.cookieExpiresMs),
    });

    return {
      status: 'success',
      message: 'Access Token Sent',
    };
  }

  @Get('/oauth/google')
  @Redirect('', 307)
  sendOauthUrl() {
    const oauthUrl = this.googleAuthService.getGoogleOauthUrl();
    return { url: oauthUrl };
  }

  @Get('/callback/google')
  @HttpCode(200)
  async handleOauthCallback(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.googleAuthService.oauthCallback(code);

    this.authService.sendCookies(res, data);

    return {
      status: 'success',
      message: 'Signin successfully',
    };
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

  @Throttle({ short: throttlerOptions.short })
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
