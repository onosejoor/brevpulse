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
    const token = this.hash(refreshToken);

    await this.refreshTokenModel.create({
      token,
      userId: new Types.ObjectId(payload.id),
      expiresAt: new Date(
        Date.now() + this.JwtConsts.refresh.jwtExpiresSeconds,
      ),
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(rawToken?: string): Promise<TokenClaims> {
    if (!rawToken) throw new UnauthorizedException('No refresh token');

    const tokenHash = this.hash(rawToken);

    const oldToken = await this.refreshTokenModel
      .findOne({
        token: tokenHash,
        expiresAt: { $gt: new Date() },
      })
      .lean();

    if (!oldToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newRefreshToken = this.generateToken();
    const newHash = this.hash(newRefreshToken);

    const [user] = await Promise.all([
      this.userModel
        .findById(oldToken.userId)
        .select('_id email_verified subscription')
        .lean(),
      this.refreshTokenModel.deleteOne({ _id: oldToken._id }),
      this.refreshTokenModel.create({
        token: newHash,
        userId: oldToken.userId,
        expiresAt: new Date(
          Date.now() + this.JwtConsts.refresh.jwtExpiresSeconds,
        ),
      }),
    ]);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: AuthTokenPayload = {
      id: user.id.toString(),
      email_verified: user.email_verified,
      subscription: user.subscription,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.JwtConsts.access.secret,
      expiresIn: this.JwtConsts.access.jwtExpiresSeconds,
    });

    return { accessToken, refreshToken: newRefreshToken };
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
