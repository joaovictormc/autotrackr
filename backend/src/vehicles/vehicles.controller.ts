import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private service: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar veículos do usuário logado' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAllByUser(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo veículo (cria marca/modelo se não existirem)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVehicleDto) {
    return this.service.create(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter veículo por ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findOne(id, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.service.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar veículo' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(id, user.sub);
  }
}
