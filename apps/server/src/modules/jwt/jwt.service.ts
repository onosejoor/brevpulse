import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants, jwtConstantstype } from 'src/utils/jwt-constants';

@Injectable()
export class JwtCustomService {
  private jwtTokens: jwtConstantstype;
  constructor(private jwtService: JwtService) {
    this.jwtTokens = jwtConstants();
  }

  async generateAuthTokens(payload: AuthTokenPayload) {
    const [refreshToken, accessToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtTokens.refresh.secret,
        expiresIn: this.jwtTokens.refresh.jwtExpiresSeconds,
      }),

      this.jwtService.signAsync(payload, {
        expiresIn: this.jwtTokens.access.jwtExpiresSeconds,
        secret: this.jwtTokens.access.secret,
      }),
    ]);

    return { refreshToken, accessToken };
  }

  async verifyToken(token: string, type: 'access' | 'refresh') {
    const secret = this.jwtTokens[type].secret;

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret,
        },
      );

      return payload;
    } catch {
      throw new UnauthorizedException(`Invalid ${type} Token`);
    }
  }

  async refreshAccessToken(token?: string) {
    if (!token) {
      throw new UnauthorizedException(`No Refresh Token`);
    }

    const secret = this.jwtTokens.refresh.secret;

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret,
        },
      );

      const newPayload = {
        id: payload.id,
        email_verified: payload.email_verified,
        subscription: payload.subscription,
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: this.jwtTokens.access.secret,
        expiresIn: this.jwtTokens.access.jwtExpiresSeconds,
      });

      return accessToken;
    } catch (error) {
      console.log(error);

      throw new UnauthorizedException(`Invalid Refresh Token`);
    }
  }
}
