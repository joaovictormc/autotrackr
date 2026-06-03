import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto, BulkImportBrandsDto } from './dto/brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandsController {
  constructor(private service: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as marcas' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Criar marca (admin)' })
  create(@Body() dto: CreateBrandDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar marca (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deletar marca (admin)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('bulk-import')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Importar marcas em lote (admin)' })
  bulkImport(@Body() dto: BulkImportBrandsDto) {
    return this.service.bulkImport(dto.brands);
  }
}
