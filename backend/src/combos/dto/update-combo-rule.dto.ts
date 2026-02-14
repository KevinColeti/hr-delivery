import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ComboRuleType } from '../../entities/combo-rule.entity';

export class UpdateComboRuleDto {
  @IsOptional()
  @IsEnum(ComboRuleType)
  type?: ComboRuleType;

  @IsOptional()
  @IsInt()
  @Min(1)
  productId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumQuantity?: number;
}
