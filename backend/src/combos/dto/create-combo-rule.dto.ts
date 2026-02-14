import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ComboRuleType } from '../../entities/combo-rule.entity';

export class CreateComboRuleDto {
  @IsEnum(ComboRuleType)
  type: ComboRuleType;

  @IsOptional()
  @IsInt()
  @Min(1)
  productId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsInt()
  @Min(1)
  minimumQuantity: number;
}
