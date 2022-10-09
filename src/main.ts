import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export let app: INestApplication;

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<string>('SERVER_PORT');

  // Firebase Admin
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

  // Swagger API 문서화
  const config = new DocumentBuilder()
    .addBearerAuth()
    .addCookieAuth('waverefresh')
    .setTitle('Wave API')
    .setDescription('Wave에 사용되는 대한 API 문서입니다.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: true });
  app.listen(process.env.PORT || port || 3000, () => {
    logger.log(`Application running on port ${port}`);
  });
}
bootstrap();
