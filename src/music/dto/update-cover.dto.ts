import { UpdateMusicDataDto } from './update-music-data.dto';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { MulterFile } from 'src/entities/common.types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCoverDto {
  @ApiProperty({ required: true, description: '이미지파일' })
  @IsNotEmpty()
  cover: MulterFile;

  @ApiProperty({ required: true, description: '음악파일 업데이트 데이터' })
  @IsOptional()
  @Type(() => UpdateMusicDataDto)
  @ValidateNested()
  data?: UpdateMusicDataDto;
}
