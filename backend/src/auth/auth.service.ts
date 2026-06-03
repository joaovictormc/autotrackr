import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(email: string, password: string, name: string, phone?: string) {
    const user = await this.users.create({ email, password, name, phone });
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  async signIn(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.hashedPassword) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const safeUser = { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role };
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: safeUser, ...tokens };
  }

  async signOut(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, token: refreshToken },
    });
  }

  async refresh(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.generateTokens(user.id, user.email, user.role);
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return; // silently succeed — don't leak email existence

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.passwordResetToken.create({ data: { token, email, expiresAt } });
    await this.sendResetEmail(email, token);
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const user = await this.users.findByEmail(record.email);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.users.updatePassword(user.id, newPassword);
    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  setRefreshCookie(res: Response, refreshToken: string) {
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
      maxAge,
    });
  }

  clearRefreshCookie(res: Response) {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
      maxAge: 0,
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const rawToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { token: rawToken, userId, expiresAt },
    });

    return { accessToken, refreshToken: rawToken };
  }

  private async sendResetEmail(email: string, token: string) {
    const transport = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 587),
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await transport.sendMail({
      from: this.config.get('SMTP_FROM', 'noreply@autotrackr.com'),
      to: email,
      subject: 'AutoTrackr — Redefinição de senha',
      html: `<p>Clique no link abaixo para redefinir sua senha (válido por 1 hora):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }
}
