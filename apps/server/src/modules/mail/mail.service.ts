import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyEmailTemp } from './constants';
import axios from 'axios';
import { getAxiosErrorMessage } from '@repo/utils/utils';

@Injectable()
export class MailService {
  constructor(private jwtService: JwtService) {}

  generateMailToken(payload: object, expiresIn?: number) {
    const signedToken = this.jwtService.sign(
      { ...payload },
      {
        secret: process.env.EMAIL_SECRET,
        expiresIn,
      },
    );

    return signedToken;
  }

  formatVerificationEmail(name: string, token: string) {
    const url = `${process.env.FRONTEND_DOMAIN}/auth/verify?token=${token}`;
    return verifyEmailTemp.replace('%s', name).replace('%s', url);
  }

  async sendMail(to: string, subject: string, template: string) {
    try {
      const { data } = await axios.post<{ success: boolean; message: string }>(
        `${process.env.EMAIL_API_URL}/send-email`,
        {
          to,
          subject,
          html: template,
          from: 'BrevPulse',
        },
        {
          headers: {
            'X-API-KEY': process.env.EMAIL_API_TOKEN,
          },
        },
      );

      return data;
    } catch (error) {
      return { success: false, message: getAxiosErrorMessage(error) };
    }
  }
}
