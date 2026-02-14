import { IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { StockMovementType } from '../../entities/stock-movement.entity';

export class CreateStockMovementDto {
  @IsInt()
  @Min(1)
  ingredientId: number;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  targetQuantity?: number;

  @IsString()
  @MaxLength(180)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
