import { AuthProfileDto } from './auth-profile.dto';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { MulterFile } from 'src/entities/common.types';

export class UpdateProfileImageDto {
  @IsOptional()
  image: MulterFile;

  @IsOptional()
  @Type(() => AuthProfileDto)
  @ValidateNested()
  data?: AuthProfileDto;
}
