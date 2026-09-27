import { ApiProperty } from '@nestjs/swagger';
import { OrderPriority } from '@prisma/client';
import { IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  requestTypeId!: string;

  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  applicant!: string;

  @ApiProperty({ example: 'Preciso de uma segunda via da certidão de nascimento.' })
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ enum: OrderPriority, default: OrderPriority.NORMAL })
  @IsEnum(OrderPriority)
  priority!: OrderPriority;
}

