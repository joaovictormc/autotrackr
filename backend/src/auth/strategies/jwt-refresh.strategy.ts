import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Tenta cookie (web) e depois body (mobile)
        (req: Request) => req?.cookies?.refreshToken ?? req?.body?.refreshToken ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true as const,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const token = req?.cookies?.refreshToken ?? req?.body?.refreshToken;
    if (!token) throw new UnauthorizedException();

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.userId !== payload.sub || stored.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }

    return { sub: payload.sub };
  }
}
