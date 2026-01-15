import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ description: 'New order value', example: 1 })
  @IsInt()
  @Min(0)
  order: number;
}

