import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UploadMusicDataDto } from './upload-music-data.dto';

export class MusicDataDto extends UploadMusicDataDto {
  @IsNotEmpty()
  @IsString()
  filename: string;

  @IsNotEmpty()
  @IsString()
  link: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  waveform?: string;
}
