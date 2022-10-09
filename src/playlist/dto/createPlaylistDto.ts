import { EntityStatus } from './../../entities/common.types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlaylistDto {
  @ApiProperty({ required: true, description: '플레이리스트 제목' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '음악 아이디 배열' })
  @IsOptional()
  @IsNumber({}, { each: true })
  musicIds: number[];

  @ApiProperty({ enum: ['PUBLIC', 'PRIVATE'], description: '공개여부' })
  @IsOptional()
  @IsString()
  status: EntityStatus;
}
