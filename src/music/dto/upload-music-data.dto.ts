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
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  permalink: string;

  @IsNotEmpty()
  @IsNumberString()
  @IsNumber()
  duration: number;

  @IsOptional()
  status: EntityStatus;

  @IsOptional()
  @IsArray()
  genre?: string[];

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  // Music Metadata
  @IsOptional()
  @IsString()
  album?: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  albumartist?: string;

  @IsOptional()
  @IsArray()
  composer?: string[];

  @IsOptional()
  @IsString()
  year?: number;

  @IsOptional()
  @IsArray()
  lyrics?: string[];
}
