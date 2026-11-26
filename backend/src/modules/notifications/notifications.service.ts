import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

export interface SendEmailInput {
  userId: string;
  to: string;
  type: string;
  subject: string;
  content: string;
  html?: string;
  devLogNote?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = Number(this.configService.get<string>('SMTP_PORT', '1025'));

    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
      });
    } else {
      this.transporter = null;
    }
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        channel: NotificationChannel.EMAIL,
        type: input.type,
        subject: input.subject,
        content: input.content,
        status: NotificationStatus.PENDING,
      },
    });

    const from = this.configService.get<string>(
      'EMAIL_FROM',
      'Prime Maestros Hub <noreply@primemaestros.local>',
    );
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');

    try {
      if (resendApiKey) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [input.to],
            subject: input.subject,
            text: input.content,
            html: input.html,
          }),
        });

        if (!res.ok) {
          throw new Error(`Resend API error (${res.status})`);
        }
      } else if (this.transporter) {
        await this.transporter.sendMail({
          from,
          to: input.to,
          subject: input.subject,
          text: input.content,
          html: input.html,
        });
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Email delivery fallback (${input.type} to ${input.to}): ${errorMessage}`,
      );
      if (
        this.configService.get<string>('NODE_ENV') !== 'production' &&
        input.devLogNote
      ) {
        this.logger.log(`[DEV EMAIL LINK] ${input.devLogNote}`);
      }
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          errorMessage,
        },
      });
    }
  }
}
