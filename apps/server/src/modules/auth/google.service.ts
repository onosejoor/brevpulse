import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/mongodb/schemas/user.schema';
import { JwtCustomService } from '../jwt/jwt.service';

@Injectable()
export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private customJwtService: JwtCustomService,
  ) {
    this.oauth2Client = new OAuth2Client({
      clientId: process.env.G_CLIENT_ID,
      clientSecret: process.env.G_CLIENT_SECRET,
      redirectUri: process.env.G_REDIRECT_URI,
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
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    const userInfo = await this.oauth2Client.getTokenInfo(tokens.access_token!);

    if (!userInfo.email) {
      throw new BadRequestException('Email Not Provided By Google');
    }

    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    const { name, picture } = response.data;

    const dbUser = await this.userModel.findOne({ email: userInfo.email });

    let tokenPayload: AuthTokenPayload;

    if (!dbUser) {
      const newUser = new this.userModel({
        name: name,
        email: userInfo.email,
        email_verified: userInfo.email_verified,
        avatar: picture || '',
      });
      await newUser.save();

      tokenPayload = {
        email_verified: userInfo.email_verified,
        id: newUser._id as string,
        subscription: newUser.subscription,
      };
    } else {
      if (!dbUser.avatar) {
        dbUser.avatar = picture!;
      }
      dbUser.email_verified = userInfo.email_verified!;

      await dbUser.save();

      tokenPayload = {
        email_verified: userInfo.email_verified,
        id: dbUser.id,
        subscription: dbUser.subscription,
      };
    }

    const { refreshToken, accessToken } =
      await this.customJwtService.generateAuthTokens(tokenPayload);

    return { refreshToken, accessToken };
  }
}
