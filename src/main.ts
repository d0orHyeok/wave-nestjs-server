import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

export let app: INestApplication;

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<string>('SERVER_PORT');

  const adminConfig: ServiceAccount = {
    projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
    privateKey: configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      .replace(/\\n/g, '\n'),
    clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(adminConfig),
    storageBucket: 'gs://wave-f1616.appspot.com',
  });

  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: true });
  app.listen(process.env.PORT || port || 3000, () => {
    logger.log(`Application running on port ${port}`);
  });
}
bootstrap();
