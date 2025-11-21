import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyEmailTemp } from './constants';
import axios from 'axios';
import { getAxiosErrorMessage } from '@repo/utils/utils';

class DecodeJwtData {
  _id: string;
  email: string;
  exp: number;
  iat: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private jwtService: JwtService) {}

  async generateMailToken(payload: object, expiresIn?: number) {
    const signedToken = await this.jwtService.signAsync(
      { ...payload },
      {
        secret: process.env.EMAIL_SECRET,
        expiresIn,
      },
    );

    return signedToken;
  }

  async decodeMailToken(token: string) {
    try {
      const decodedData = await this.jwtService.verifyAsync<DecodeJwtData>(
        token,
        {
          secret: process.env.EMAIL_SECRET,
        },
      );

      return { data: decodedData, status: 'success' };
    } catch (error) {
      this.logger.warn(`Failed to decode mail token: ${error.message}`);
      return { message: error, status: 'error' };
    }
  }

  formatVerificationEmail(name: string, token: string) {
    const url = `${process.env.FRONTEND_DOMAIN}/auth/verify?token=${token}`;
    return verifyEmailTemp.replace('%s', name).replace('%s', url);
  }

  async sendMail(to: string, subject: string, template: string) {
    try {
      this.logger.log(`Sending email to: ${to} with subject: ${subject}`);
      const { data } = await axios.post<{ success: boolean; message: string }>(
        `${process.env.EMAIL_API_URL}/send-email`,
        {
          to,
          subject,
          html: template,
          from: 'Brevpulse',
        },
        {
          headers: {
            'X-API-KEY': process.env.EMAIL_API_TOKEN,
          },
        },
      );

      if (!data.success) {
        this.logger.error(`Failed to send email to ${to}: ${data.message}`);
      }
      return data;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error.stack);
      return { success: false, message: getAxiosErrorMessage(error) };
    }
  }
}
