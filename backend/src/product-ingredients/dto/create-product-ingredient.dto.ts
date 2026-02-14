import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductIngredientDto {
  @IsNumber()
  @Min(1)
  ingredientId: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  unit?: string;
}
