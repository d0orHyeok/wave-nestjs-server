import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { MulterFile } from 'src/entities/common.types';
import { UploadMusicDataDto } from './upload-music-data.dto';

export class UploadMusicDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  music: MulterFile;

  @ApiProperty()
  @IsOptional()
  cover?: MulterFile;

  @ApiProperty({ required: true, description: '음악 정보' })
  @IsNotEmpty()
  @Type(() => UploadMusicDataDto)
  @ValidateNested()
  data: UploadMusicDataDto;
}
