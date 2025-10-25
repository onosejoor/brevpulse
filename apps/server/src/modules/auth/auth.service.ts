import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Status } from '@repo/shared-types/globals';
import { Model } from 'mongoose';
import { ApiResDTO } from 'src/dtos/api.response.dto';
import { CreateUserDto, SigninUserDTO } from 'src/dtos/auth.dto';
import { User, UserDocument } from 'src/mongodb/schemas/user.schema';
import argon2 from 'argon2';
import { jwtConstants, jwtConstantstype } from 'src/utils/jwt-constants';
import { MailService } from '../mail/mail.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { type Response } from 'express';
import { JwtCustomService } from '../jwt/jwt.service';

class TokenRes {
  refreshToken: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  private jwtTokens: jwtConstantstype;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private customJwtService: JwtCustomService,
    private mailService: MailService,
    @InjectQueue('email-queue') private emailQueue: Queue,
  ) {
    this.jwtTokens = jwtConstants();
  }

  async createUser(dto: CreateUserDto): Promise<ApiResDTO> {
    const userExists = await this.userModel.exists({ email: dto.email });

    if (userExists) {
      throw new BadRequestException('User Already Exist');
    }

    const newUser = new this.userModel({
      ...dto,
    });

    await newUser.save();

    const emailToken = await this.mailService.generateMailToken(
      {
        _id: newUser.id,
        email: newUser.email,
      },
      this.jwtTokens.email.jwtExpiresSeconds,
    );

    await this.emailQueue.add('verify-email', {
      type: 'verification',
      data: { token: emailToken, name: newUser.name, email: newUser.email },
    });

    return {
      status: 'success' as Status,
      message: `A verification mail has been sent to ${newUser.email}, kindly verify your mail to continue`,
    };
  }

  async verifyEmail(token: string): Promise<ApiResDTO<TokenRes>> {
    const { status, data, message } =
      await this.mailService.decodeMailToken(token);

    if (status !== 'success') {
      return {
        status: status as Status,
        message,
      };
    }

    const findUser = await this.userModel.findById(data?._id);

    if (!findUser) {
      throw new NotFoundException('User does not exist');
    }

    if (findUser.email_verified) {
      throw new BadRequestException('User already verified');
    }

    await findUser.updateOne({ email_verified: true });

    const payload = {
      email_verified: true,
      id: findUser._id as string,
      subscription: findUser.subscription,
    };

    const { refreshToken, accessToken } =
      await this.customJwtService.generateAuthTokens(payload);

    return {
      data: { refreshToken, accessToken },
      status: 'success',
      message: 'Email Verified Successfully',
    };
  }

  async signinUser(dto: SigninUserDTO): Promise<ApiResDTO<TokenRes>> {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password +email +_id')
      .lean();

    if (!user) {
      throw new NotFoundException('Invalid Credentials');
    }

    const isCorrectpassword = await argon2.verify(user.password, dto.password);
    if (!isCorrectpassword) {
      throw new NotFoundException('Invalid Credentials');
    }

    const payload = {
      email_verified: user.email_verified,
      id: user._id as string,
      subscription: user.subscription,
    };

    const { refreshToken, accessToken } =
      await this.customJwtService.generateAuthTokens(payload);

    return {
      status: 'success',
      data: { refreshToken, accessToken },
      message: `Welcome ${user.name}`,
    };
  }

  async refreshAccessToken(token?: string) {
    return await this.customJwtService.refreshAccessToken(token);
  }

  sendCookies(res: Response, data: TokenRes) {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('bp_rtoken', data.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + this.jwtTokens.refresh.cookieExpiresMs),
    });

    res.cookie('bp_atoken', data.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + this.jwtTokens.access.cookieExpiresMs),
    });
  }
}
