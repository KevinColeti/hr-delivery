import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../../entities/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  cancellationCustomerMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  cancellationInternalNote?: string;
}
