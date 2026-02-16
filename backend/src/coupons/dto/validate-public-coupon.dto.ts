import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Payload de validacao de cupom no checkout publico.
 */
export class ValidatePublicCouponDto {
  @IsString()
  @MaxLength(40)
  code: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  clientPhone?: string;
}
