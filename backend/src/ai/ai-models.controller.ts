import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { AiModelsService } from './ai-models.service';
import { AiService } from './ai.service';
import { CreateAiModelDto, UpdateAiModelDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('AI Models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('ai/models')
export class AiModelsController {
  constructor(
    private models: AiModelsService,
    private ai: AiService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar modelos de IA (admin)' })
  findAll() {
    return this.models.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Criar modelo de IA (admin)' })
  create(@Body() dto: CreateAiModelDto) {
    return this.models.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar modelo de IA (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateAiModelDto) {
    return this.models.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover modelo de IA (admin)' })
  remove(@Param('id') id: string) {
    return this.models.remove(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Testar modelo (gera lembrete de exemplo)' })
  test(@Param('id') id: string) {
    return this.ai.test(id);
  }
}
