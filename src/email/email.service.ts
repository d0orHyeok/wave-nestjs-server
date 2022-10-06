import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  createGmailTransporter() {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      port: 587,
      host: 'smtp.gmail.com',
      secure: false,
      requireTLS: true,
      auth: {
        user: this.configService.get<string>('MAILER_EMAIL'),
        pass: this.configService.get<string>('MAILER_PSSWORD'),
      },
    });
    return transporter;
  }
}
