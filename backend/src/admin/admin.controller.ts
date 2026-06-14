import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Plan, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Leitura liberada para ADMIN e OPERADOR; mutações de role/plano ficam só com ADMIN.
const STAFF = [Role.ADMIN, Role.OPERADOR];

class UpdateRoleDto {
  role: Role;
}

class UpdatePlanDto {
  plan: Plan;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Estatísticas gerais do sistema' })
  async getStats() {
    const [users, vehicles, brands, models, admins, proUsers] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.vehicle.count(),
      this.prisma.brand.count(),
      this.prisma.model.count(),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.user.count({ where: { plan: Plan.PRO } }),
    ]);
    return { users, vehicles, brands, models, admins, proUsers };
  }

  @Get('users')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Listar todos os usuários' })
  getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, phone: true, role: true, plan: true, proSince: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Alterar role do usuário' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: { id: true, email: true, role: true },
    });
  }

  @Put('users/:id/plan')
  @ApiOperation({ summary: 'Alterar plano do usuário (Free/Pro)' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.prisma.user.update({
      where: { id },
      data: { plan: dto.plan, proSince: dto.plan === Plan.PRO ? new Date() : null },
      select: { id: true, email: true, plan: true, proSince: true },
    });
  }
}
