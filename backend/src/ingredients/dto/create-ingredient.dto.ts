import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(12)
  unit: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minimumQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
