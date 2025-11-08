import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const adminHeader = req.headers.authorization;

    if (!adminHeader) {
      return false;
    }

    if (adminHeader !== process.env.ADMIN_HEADER) {
      return false;
    }

    return true;
  }
}
