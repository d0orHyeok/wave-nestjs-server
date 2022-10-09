import { AuthProfileDto } from './auth-profile.dto';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { MulterFile } from 'src/entities/common.types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileImageDto {
  @ApiProperty()
  @IsOptional()
  image?: MulterFile;

  @ApiProperty()
  @IsOptional()
  @Type(() => AuthProfileDto)
  @ValidateNested()
  data?: AuthProfileDto;
}
