import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { TripsService } from './trips.service';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/trips')
export class TripsController {
  constructor(private service: TripsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar trajetos de um veículo' })
  findAll(@CurrentUser() user: JwtPayload, @Param('vehicleId') vehicleId: string) {
    return this.service.findAllByVehicle(vehicleId, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar trajeto' })
  create(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateTripDto,
  ) {
    return this.service.create(vehicleId, user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar trajeto' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.service.update(vehicleId, id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar trajeto' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(vehicleId, id, user.sub);
  }
}
