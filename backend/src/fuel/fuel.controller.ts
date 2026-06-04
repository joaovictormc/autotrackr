import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { FuelService } from './fuel.service';
import { CreateFuelRecordDto, UpdateFuelRecordDto } from './dto/fuel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Fuel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/fuel')
export class FuelController {
  constructor(private service: FuelService) {}

  @Get()
  @ApiOperation({ summary: 'Listar abastecimentos de um veículo' })
  findAll(@CurrentUser() user: JwtPayload, @Param('vehicleId') vehicleId: string) {
    return this.service.findAllByVehicle(vehicleId, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar abastecimento' })
  create(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateFuelRecordDto,
  ) {
    return this.service.create(vehicleId, user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar abastecimento' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFuelRecordDto,
  ) {
    return this.service.update(vehicleId, id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar abastecimento' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(vehicleId, id, user.sub);
  }
}
