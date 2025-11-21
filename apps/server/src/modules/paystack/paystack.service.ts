import { Injectable, Logger } from '@nestjs/common';
import { Paystack } from 'paystack-sdk';
import * as crypto from 'crypto';
import { ApiResDTO } from '@/dtos/api.response.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import { Model } from 'mongoose';
import appConfig from '@/common/config/app.config';

@Injectable()
export class PaystackService {
  private paystack: Paystack;
  private appConf: ReturnType<typeof appConfig>;
  private readonly logger = new Logger(PaystackService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.appConf = appConfig();
    this.paystack = new Paystack(this.appConf.paystack.secretKey!);
  }

  async startCheckout(userId: string) {
    const user = await this.userModel.findById(userId).select('email').lean();
    this.logger.log(`Starting checkout for user ${userId}`);

    const init = await this.paystack.transaction.initialize({
      email: user!.email,
      amount: '400000',
      plan: this.appConf.paystack.proPlanCode!,
      metadata: { user_id: userId },
      channels: ['card'],
      callback_url: `${process.env.FRONTEND_URL}/success`,
    });

    if (!init.status) {
      this.logger.error(
        `Paystack checkout failed for ${userId}: ${init.message}`,
      );
      return {
        status: 'error',
        message: init.message,
      };
    }
    this.logger.log(`Checkout initiated for user ${userId}`);
    return {
      status: 'success',
      message: init.message,
      data: init.data,
    };
  }

  verify(event: any, signature: string, rawBody: string) {
    const hash = crypto
      .createHmac('sha512', this.appConf.paystack.secretKey!)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      this.logger.warn('Invalid Paystack signature received');
      throw new Error('Invalid signature');
    }
    return event;
  }

  // 3. Cancel subscription
  async cancel(subCode: string, token: string): Promise<ApiResDTO> {
    this.logger.log(`Attempting to cancel Paystack subscription ${subCode}`);
    const res = await this.paystack.subscription.disable({
      code: subCode,
      token,
    });
    if (res.status) {
      return {
        status: 'success',
        message: res.message,
      };
    }
    this.logger.error(
      `Failed to cancel Paystack subscription ${subCode}: ${res.message}`,
    );
    return {
      status: 'error',
      message: res.message,
    };
  }
}
