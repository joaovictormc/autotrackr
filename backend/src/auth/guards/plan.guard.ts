import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Plan } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRES_PRO_KEY } from '../decorators/requires-pro.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresPro = this.reflector.getAllAndOverride<boolean>(REQUIRES_PRO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiresPro) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.sub) throw new ForbiddenException();

    // Lê o plano fresco do banco para não depender de JWT possivelmente defasado.
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { plan: true },
    });
    if (dbUser?.plan !== Plan.PRO) {
      throw new ForbiddenException({ code: 'PLAN_REQUIRED', message: 'Recurso disponível apenas no plano Pro.' });
    }
    return true;
  }
}
