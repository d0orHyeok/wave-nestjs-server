import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { MulterFile } from 'src/entities/common.types';
import { UploadMusicDataDto } from './upload-music-data.dto';

export class UploadMusicDto {
  @IsNotEmpty()
  music: MulterFile;

  @IsOptional()
  cover?: MulterFile;

  @IsNotEmpty()
  @Type(() => UploadMusicDataDto)
  @ValidateNested()
  data: UploadMusicDataDto;
}
