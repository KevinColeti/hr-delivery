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
 * Extra selecionado por item no checkout publico.
 */
class CreatePublicCheckoutOrderItemExtraDto {
  @IsInt()
  @Min(1)
  extraId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

/**
 * Item de pedido enviado no checkout publico.
 */
class CreatePublicCheckoutOrderItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePublicCheckoutOrderItemExtraDto)
  extras?: CreatePublicCheckoutOrderItemExtraDto[];
}

/**
 * Dados de cliente recebidos no checkout publico.
 *
 * O telefone e usado como chave de deduplicacao do cliente.
 */
export class CreatePublicCheckoutClientDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;
}

/**
 * Payload de checkout publico.
 *
 * Diferenca principal para o fluxo interno:
 * - nao recebe `clientId`;
 * - recebe bloco `client` para criacao/atualizacao automatica.
 */
export class CreatePublicCheckoutOrderDto {
  @ValidateNested()
  @Type(() => CreatePublicCheckoutClientDto)
  client: CreatePublicCheckoutClientDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePublicCheckoutOrderItemDto)
  items: CreatePublicCheckoutOrderItemDto[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
