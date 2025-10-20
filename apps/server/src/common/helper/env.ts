// src/common/helpers/env.helper.ts
import { ConfigService } from '@nestjs/config';

let configService: ConfigService | null = null;

export function setConfigService(service: ConfigService) {
  configService = service;
}

export function env(key: string): string {
  if (!configService) {
    throw new Error('ConfigService not available');
  }
  const value = configService.get<string>(key);
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

export function envOrDefault(key: string, defaultValue: string): string {
  return configService?.get(key) || defaultValue;
}

export function isProduction(): boolean {
  return configService?.get('NODE_ENV') === 'production';
}
