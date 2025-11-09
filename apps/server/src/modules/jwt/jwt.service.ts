import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { jwtConstants } from 'src/utils/jwt-constants';
import { createHash, randomBytes } from 'crypto';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '@/mongodb/schemas/refresh-token.schema';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';

type TokenClaims = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class JwtCustomService {
  private JwtConsts: ReturnType<typeof jwtConstants>;

  constructor(
    private jwtService: JwtService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {
    this.JwtConsts = jwtConstants();
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateToken(): string {
    return randomBytes(64).toString('hex');
  }

  async generateAuthTokens(payload: AuthTokenPayload): Promise<TokenClaims> {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.JwtConsts.access.secret,
      expiresIn: this.JwtConsts.access.jwtExpiresSeconds,
    });

    const refreshToken = this.generateToken();
    const tokenHash = this.hash(refreshToken);

    await this.refreshTokenModel.findOneAndUpdate(
      { userId: new Types.ObjectId(payload.id) },
      {
        token: tokenHash,
        expiresAt: new Date(
          Date.now() + this.JwtConsts.refresh.jwtExpiresSeconds * 1000,
        ),
      },
      { upsert: true, new: true },
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(
    rawToken?: string,
  ): Promise<TokenClaims['accessToken']> {
    if (!rawToken) throw new UnauthorizedException('No refresh token');

    const tokenHash = this.hash(rawToken);

    const rftoken = await this.refreshTokenModel
      .findOne({
        token: tokenHash,
      })
      .lean();

    if (!rftoken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userModel
      .findById(rftoken.userId)
      .select('_id email_verified subscription')
      .lean();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: AuthTokenPayload = {
      id: user._id.toString(),
      email_verified: user.email_verified,
      subscription: user.subscription,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.JwtConsts.access.secret,
      expiresIn: this.JwtConsts.access.jwtExpiresSeconds,
    });

    return accessToken;
  }

  async revokeToken(rawToken: string): Promise<void> {
    const token = this.hash(rawToken);
    await this.refreshTokenModel.deleteOne({ token });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }

  async verifyAccessToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.JwtConsts.access.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
