import { EntityStatus } from './../../entities/common.types';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlaylistDto {
  @ApiProperty({ description: '플레이리스트 제목' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: '플레이리스트 고유주소' })
  @IsOptional()
  @IsString()
  permalink: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ enum: ['PUBLIC', 'PRIVATE'], description: '공개여부' })
  @IsOptional()
  @IsString()
  status: EntityStatus;

  @ApiProperty()
  @IsOptional()
  musicIds: number[];
}
