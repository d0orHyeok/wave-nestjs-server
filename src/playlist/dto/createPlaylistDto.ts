import { EntityStatus } from './../../entities/common.types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlaylistDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber({}, { each: true })
  musicIds: number[];

  @IsOptional()
  @IsString()
  status: EntityStatus;
}
