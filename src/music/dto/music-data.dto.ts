import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UploadMusicDataDto } from './upload-music-data.dto';

export class MusicDataDto extends UploadMusicDataDto {
  @ApiProperty({ required: true, description: 'Firebase에 저장된 파일명' })
  @IsNotEmpty()
  @IsString()
  filename: string;

  @ApiProperty({ required: true, description: 'Firebase에 저장된 파일링크' })
  @IsNotEmpty()
  @IsString()
  link: string;

  @ApiProperty({ description: 'Firebase에 저장된 파일링크' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ description: 'Firebase에 저장된 파일명' })
  @IsOptional()
  @IsString()
  coverFilename?: string;

  @ApiProperty({ description: '오디오파일 파형분석 데이터' })
  @IsOptional()
  @IsString()
  waveform?: string;
}
