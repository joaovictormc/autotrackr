import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { RevenueService } from './revenue.service';
import { CreateRevenueRecordDto, UpdateRevenueRecordDto } from './dto/revenue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Revenue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/revenue')
export class RevenueController {
  constructor(private service: RevenueService) {}

  @Get()
  @ApiOperation({ summary: 'Listar receitas de um veículo' })
  findAll(@CurrentUser() user: JwtPayload, @Param('vehicleId') vehicleId: string) {
    return this.service.findAllByVehicle(vehicleId, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar receita' })
  create(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateRevenueRecordDto,
  ) {
    return this.service.create(vehicleId, user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar receita' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRevenueRecordDto,
  ) {
    return this.service.update(vehicleId, id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar receita' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(vehicleId, id, user.sub);
  }
}
