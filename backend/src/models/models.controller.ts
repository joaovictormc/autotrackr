import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { ModelsService } from './models.service';
import { CreateModelDto, UpdateModelDto, BulkImportModelsDto } from './dto/model.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('models')
export class ModelsController {
  constructor(private service: ModelsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar modelos (opcionalmente filtrar por brandId)' })
  @ApiQuery({ name: 'brandId', required: false })
  findAll(@Query('brandId') brandId?: string) {
    return this.service.findAll(brandId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Criar modelo (admin)' })
  create(@Body() dto: CreateModelDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar modelo (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateModelDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deletar modelo (admin)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('bulk-import')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Importar modelos em lote (admin)' })
  bulkImport(@Body() dto: BulkImportModelsDto) {
    return this.service.bulkImport(dto.models);
  }
}
