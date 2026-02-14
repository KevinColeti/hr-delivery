import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateProductIngredientDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  unit?: string;
}
