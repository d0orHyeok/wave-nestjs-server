import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { EntityStatus } from 'src/entities/common.types';

export class UploadMusicDataDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: true, description: '음악 고유주소' })
  @IsNotEmpty()
  @IsString()
  permalink: string;

  @ApiProperty({ required: true, description: '음악 길이(초)' })
  @IsNotEmpty()
  @IsNumberString()
  @IsNumber()
  duration: number;

  @ApiProperty({
    enum: ['PUBLIC, PRIVATE'],
    default: 'PUBLIC',
    description: '공개여부',
  })
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

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;

  // Music Metadata
  @ApiProperty()
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
