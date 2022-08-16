import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { UploadMusicDataDto } from './upload-music-data.dto';

export class UploadMusicDto {
  @IsNotEmpty()
  music: Express.Multer.File;

  @IsOptional()
  cover?: Express.Multer.File;

  @IsNotEmpty()
  @Type(() => UploadMusicDataDto)
  @ValidateNested()
  data: UploadMusicDataDto;
}
