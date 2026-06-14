import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');

  constructor(private config: ConfigService) {}

  private transport() {
    return nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 587),
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  /** Envia um e-mail. Se SMTP não estiver configurado, apenas loga (modo dev/stub). */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    const host = this.config.get('SMTP_HOST');
    if (!host) {
      this.logger.warn(`SMTP não configurado — e-mail para ${to} não enviado (assunto: "${subject}").`);
      return false;
    }
    await this.transport().sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@autotrackr.com'),
      to,
      subject,
      html,
    });
    return true;
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    await this.send(
      email,
      'AutoTrackr — Redefinição de senha',
      `<p>Clique no link abaixo para redefinir sua senha (válido por 1 hora):</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>`,
    );
  }
}
