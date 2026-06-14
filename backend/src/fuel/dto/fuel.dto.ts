import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType } from '@prisma/client';

export class CreateFuelRecordDto {
  @ApiProperty({ example: '2026-06-04' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: FuelType, example: FuelType.GASOLINA })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ example: 45000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: 38.5, description: 'Litros, m³ ou kWh' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 5.899 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiProperty({ example: 227.11 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalCost: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  fullTank?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  station?: string;

  @ApiPropertyOptional({ example: -23.5505 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -46.6333 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFuelRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: FuelType })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

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
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fullTank?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  station?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
