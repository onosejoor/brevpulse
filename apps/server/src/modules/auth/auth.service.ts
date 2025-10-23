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
import { User } from 'src/mongodb/schemas/user.schema';
import argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/utils/jwt-constants';
import { MailService } from '../mail/mail.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Response } from 'express';

class TokenRes {
  refreshToken: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectQueue('email-queue') private emailQueue: Queue,
  ) {}

  async createUser(dto: CreateUserDto): Promise<ApiResDTO> {
    const userExists = await this.userModel.exists({ email: dto.email });

    if (userExists) {
      throw new BadRequestException('User Already Exist');
    }

    const newUser = new this.userModel({
      ...dto,
    });

    await newUser.save();
    const jwtTokens = jwtConstants();

    const emailToken = await this.mailService.generateMailToken(
      {
        _id: newUser.id,
        email: newUser.email,
      },
      jwtTokens.email.expiresAt,
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
      return {
        status: 'error',
        message: 'User does not exist',
      };
    }

    await findUser.updateOne({ email_verified: true });

    const payload = {
      email_verified: true,
      id: findUser._id,
      subscription: findUser.subscription,
    };

    const jwtTokens = jwtConstants();

    const [refreshToken, accessToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtTokens.refresh.secret,
        expiresIn: jwtTokens.refresh.expiresAt,
      }),

      this.jwtService.signAsync(payload, {
        expiresIn: jwtTokens.access.expiresAt,
        secret: jwtTokens.access.secret,
      }),
    ]);

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
      id: user._id,
      subscription: user.subscription,
    };

    const jwtTokens = jwtConstants();

    const [refreshToken, accessToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtTokens.refresh.secret,
        expiresIn: jwtTokens.refresh.expiresAt,
      }),

      this.jwtService.signAsync(payload, {
        expiresIn: jwtTokens.access.expiresAt,
        secret: jwtTokens.access.secret,
      }),
    ]);

    return {
      status: 'success',
      data: { refreshToken, accessToken },
      message: `Welcome ${user.name}`,
    };
  }

  sendCookies(res: Response, data: TokenRes) {
    const isProd = process.env.NODE_ENV === 'production';

    const jwtTokens = jwtConstants();

    res.cookie('bp_rtoken', data.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + jwtTokens.refresh.expiresAt),
    });

    res.cookie('bp_atoken', data.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + jwtTokens.access.expiresAt),
    });
  }
}
