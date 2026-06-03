import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Nome da marca (será criada se não existir)' })
  @IsString()
  @IsNotEmpty()
  brandName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandApiCode?: string;

  @ApiProperty({ description: 'Nome do modelo (será criado se não existir)' })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelApiCode?: string;

  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  @IsNotEmpty()
  plate: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  year: number;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiYearCode?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isFavorite?: boolean;
}
