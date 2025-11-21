import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  Get,
  UseGuards,
} from '@nestjs/common';
import { PaystackService } from '../paystack/paystack.service';
import { SubscriptionService } from './subscription.service';
import type { Request, Response } from 'express';
import { User } from '@/common/decorators/user.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private paystack: PaystackService,
    private subService: SubscriptionService,
  ) {}

  @Get('create')
  @UseGuards(AuthGuard)
  async create(@User() user: AuthTokenPayload) {
    return this.paystack.startCheckout(user.id);
  }

  @Get('status')
  @UseGuards(AuthGuard)
  status(@User() user: AuthTokenPayload) {
    return this.subService.getStatus(user.id);
  }

  @Get('cancel')
  @UseGuards(AuthGuard)
  async cancel(@User() user: AuthTokenPayload) {
    return this.subService.cancelSubscription(user.id);
  }

  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() req: Request, @Res() res: Response) {
    const payload = JSON.stringify(req.body);
    const event = this.paystack.verify(
      req.body,
      req.headers['x-paystack-signature'] as string,
      payload,
    );

    await this.subService.handleWebhook(event);

    res.sendStatus(200);
  }
}
