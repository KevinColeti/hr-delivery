import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  storeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  storeDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactWhatsApp?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFeeDefault?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumOrderAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  serviceAreaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  operatingHoursDescription?: string;

  @IsOptional()
  @IsBoolean()
  isStoreOpen?: boolean;
}
