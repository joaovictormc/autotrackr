import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { ReportsService, ReportFormat } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../auth/guards/plan.guard';
import { RequiresPro } from '../auth/decorators/requires-pro.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlanGuard)
@RequiresPro()
@Controller('vehicles/:vehicleId/reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('maintenance')
  @ApiOperation({ summary: 'Exportar relatório de manutenções (Pro)' })
  @ApiQuery({ name: 'format', enum: ['pdf', 'csv'], required: false })
  async maintenance(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Query('format') format: ReportFormat = 'pdf',
    @Res() res: Response,
  ) {
    const fmt: ReportFormat = format === 'csv' ? 'csv' : 'pdf';
    const { buffer, mime, ext } = await this.service.maintenance(vehicleId, user.sub, fmt);
    this.send(res, buffer, mime, `manutencoes-${this.stamp()}.${ext}`);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Exportar relatório de receitas (Pro)' })
  @ApiQuery({ name: 'format', enum: ['pdf', 'csv'], required: false })
  async revenue(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
    @Query('format') format: ReportFormat = 'pdf',
    @Res() res: Response,
  ) {
    const fmt: ReportFormat = format === 'csv' ? 'csv' : 'pdf';
    const { buffer, mime, ext } = await this.service.revenue(vehicleId, user.sub, fmt);
    this.send(res, buffer, mime, `receitas-${this.stamp()}.${ext}`);
  }

  private stamp() {
    return new Date().toISOString().split('T')[0];
  }

  private send(res: Response, buffer: Buffer, mime: string, filename: string) {
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="autotrackr-${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
