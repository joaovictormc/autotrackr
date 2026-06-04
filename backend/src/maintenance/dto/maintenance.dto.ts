import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaintenanceDto {
  @ApiProperty({ description: 'ID do tipo de manutenção' })
  @IsString()
  @IsNotEmpty()
  maintenanceTypeId: string;

  @ApiProperty({ example: '2025-06-04' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 45000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiPropertyOptional({ example: 150.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '2025-12-01' })
  @IsOptional()
  @IsDateString()
  reminderDate?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reminderMileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class UpdateMaintenanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  maintenanceTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  reminderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reminderMileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class CreateMaintenanceTypeDto {
  @ApiProperty({ example: 'Troca de óleo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 10000, description: 'Intervalo padrão em km' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultIntervalKm?: number;

  @ApiPropertyOptional({ example: 12, description: 'Intervalo padrão em meses' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultIntervalMonths?: number;
}
