import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodError, ZodObject } from 'zod';
import { getZodErrorMessage } from '@repo/utils/utils';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodObject) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(
          `Validation failed: ${getZodErrorMessage(error)}`,
        );
      }
      throw new BadRequestException(`Validation failed: ${error}`);
    }
  }
}
