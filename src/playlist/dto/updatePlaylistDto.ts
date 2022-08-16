import { EntityStatus } from './../../entities/common.types';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePlaylistDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  permalink: string;

  @IsOptional()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  status: EntityStatus;
}
