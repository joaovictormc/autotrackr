import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class UpdateRoleDto {
  role: Role;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas gerais do sistema' })
  async getStats() {
    const [users, vehicles, brands, models, admins] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.vehicle.count(),
      this.prisma.brand.count(),
      this.prisma.model.count(),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
    ]);
    return { users, vehicles, brands, models, admins };
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar todos os usuários' })
  getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
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
}
