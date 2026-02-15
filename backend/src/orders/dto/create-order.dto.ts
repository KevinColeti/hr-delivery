import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Extra selecionado em item de pedido.
 */
class CreateOrderItemExtraDto {
  @IsInt()
  @Min(1)
  extraId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

/**
 * Item base de pedido.
 */
class CreateOrderItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemExtraDto)
  extras?: CreateOrderItemExtraDto[];
}

/**
 * Payload de criacao de pedido no fluxo interno.
 */
export class CreateOrderDto {
  @IsInt()
  @Min(1)
  clientId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
