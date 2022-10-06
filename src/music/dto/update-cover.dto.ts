import { UpdateMusicDataDto } from './update-music-data.dto';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { MulterFile } from 'src/entities/common.types';

export class UpdateCoverDto {
  @IsNotEmpty()
  cover: MulterFile;

  @IsOptional()
  @Type(() => UpdateMusicDataDto)
  @ValidateNested()
  data?: UpdateMusicDataDto;
}
