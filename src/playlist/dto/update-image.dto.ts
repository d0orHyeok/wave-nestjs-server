import { UpdatePlaylistDto } from './updatePlaylistDto';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { MulterFile } from 'src/entities/common.types';

export class UpdateImageDto {
  @IsNotEmpty()
  image: MulterFile;

  @IsOptional()
  @Type(() => UpdatePlaylistDto)
  @ValidateNested()
  data?: UpdatePlaylistDto;
}
