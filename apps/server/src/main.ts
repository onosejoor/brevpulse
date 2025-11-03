import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/custom-exception';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import appConfig from './common/config/app.config';

async function bootstrap() {
  const PORT = appConfig().PORT ?? 8080;

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(helmet());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('/v1/api');

  await app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
bootstrap();
