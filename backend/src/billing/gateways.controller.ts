import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentProvider, Role } from '@prisma/client';

import { GatewaysService } from './gateways.service';
import { UpsertGatewayDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Billing - Gateways')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing/gateways')
export class GatewaysController {
  constructor(private service: GatewaysService) {}

  // Disponível para qualquer usuário logado — só provider/label, sem credenciais.
  @Get('available')
  @ApiOperation({ summary: 'Listar métodos de pagamento habilitados' })
  findAvailable() {
    return this.service.findAvailable();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar gateways e config (admin)' })
  findAll() {
    return this.service.findAll();
  }

  @Put(':provider')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Configurar gateway (admin)' })
  upsert(@Param('provider') provider: PaymentProvider, @Body() dto: UpsertGatewayDto) {
    return this.service.upsert(provider, dto);
  }

  @Post(':provider/default')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Definir gateway padrão (admin)' })
  setDefault(@Param('provider') provider: PaymentProvider) {
    return this.service.setDefault(provider);
  }
}
