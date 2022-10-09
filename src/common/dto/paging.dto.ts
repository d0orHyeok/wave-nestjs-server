import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class PagingDto {
  @ApiProperty({ description: '가져올 개수' })
  @IsOptional()
  @IsNumber()
  take?: number;

  @ApiProperty({ description: '넘길 개수' })
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  skip?: number;
}
