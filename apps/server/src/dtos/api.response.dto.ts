import { Status } from '@repo/shared-types/globals';

export class ApiResDTO<T = any> {
  status: Status;
  message?: string;
  data?: T;
}
