import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string; success: boolean } {
    return { message: 'Hello From BrevPulse API', success: true };
  }
}
