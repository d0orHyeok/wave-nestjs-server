import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { EntityStatus } from 'src/entities/common.types';

export class UpdateMusicDataDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({ description: '음악 고유주소' })
  @IsOptional()
  @IsString()
  permalink: string;

  @ApiProperty({ description: '음악 길이(초)' })
  @IsOptional()
  @IsNumberString()
  @IsNumber()
  duration: number;

  @ApiProperty({ enum: ['PUBLIC, PRIVATE'], description: '공개여부' })
  @IsOptional()
  status: EntityStatus;

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsArray()
  genre?: string[];

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsString()
  description?: string;

  // Music Metadata
  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsString()
  album?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  artist?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  albumartist?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  composer?: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  year?: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  lyrics?: string[];
}
