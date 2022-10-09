import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHistoryDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  userId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  musicId: number;
}
