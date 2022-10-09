import { UpdatePlaylistDto } from './updatePlaylistDto';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { MulterFile } from 'src/entities/common.types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateImageDto {
  @ApiProperty({ required: true, description: '플레이리스트 커버 이미지' })
  @IsNotEmpty()
  image: MulterFile;

  @ApiProperty({ description: '플레이리스트 업데이트 데이터' })
  @IsOptional()
  @Type(() => UpdatePlaylistDto)
  @ValidateNested()
  data?: UpdatePlaylistDto;
}
