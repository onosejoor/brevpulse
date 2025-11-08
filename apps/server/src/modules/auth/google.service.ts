import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/mongodb/schemas/user.schema';
import { JwtCustomService } from '../jwt/jwt.service';
import appConfig from '@/common/config/app.config';
import { google } from 'googleapis';
import crypto from 'crypto';

@Injectable()
export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private customJwtService: JwtCustomService,
  ) {
    const appConf = appConfig();
    this.oauth2Client = new OAuth2Client({
      clientId: appConf.G_CLIENT_ID,
      clientSecret: appConf.G_CLIENT_SECRET,
      redirectUri: appConf.G_REDIRECT_URI,
    });
  }

  getGoogleOauthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
    });
  }

  async oauthCallback(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      const googleAuth = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2',
      });

      const { data: userRes } = await googleAuth.userinfo.get();

      const { name, picture, email, verified_email } = userRes;

      if (!email) {
        throw new BadRequestException('Email Not Provided By Google');
      }

      const user = await this.userModel.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            name,
            encryptionKey: crypto.randomBytes(32),
            avatar: picture,
            auth: 'google',
            email,
            preferences: {
              timezone: 'UTC',
            },
          },
          $set: {
            email_verified: verified_email,
          },
        },
        { upsert: true, new: true, runValidators: true, timestamps: true },
      );

      const tokenPayload: AuthTokenPayload = {
        id: user.id,
        email_verified: user.email_verified,
        subscription: user.subscription,
      };

      return this.customJwtService.generateAuthTokens(tokenPayload);
    } catch (error) {
      console.error('Google OAuth Callback Error:', error);
      throw new BadRequestException(
        'Failed to authenticate with Google: ' + error.message,
      );
    }
  }
}
