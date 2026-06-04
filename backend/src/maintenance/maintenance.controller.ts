import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto, CreateMaintenanceTypeDto } from './dto/maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

// ── Tipos de manutenção ────────────────────────────────────────────────────
@ApiTags('Maintenance Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maintenance/types')
export class MaintenanceTypesController {
  constructor(private service: MaintenanceService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de manutenção' })
  findAll() {
    return this.service.findAllTypes();
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo tipo de manutenção' })
  create(@Body() dto: CreateMaintenanceTypeDto) {
    return this.service.createType(dto.name, dto.defaultIntervalKm, dto.defaultIntervalMonths);
  }
}

// ── Registros de manutenção ────────────────────────────────────────────────
@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros de manutenção de um veículo' })
  findAll(@CurrentUser() user: JwtPayload, @Param('vehicleId') vehicleId: string) {
    return this.service.findAllByVehicle(vehicleId, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar manutenção' })
  create(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.service.create(vehicleId, user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar registro de manutenção' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.service.update(vehicleId, id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar registro de manutenção' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(vehicleId, id, user.sub);
  }
}
