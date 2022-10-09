import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Music } from 'src/entities/music.entity';

export class GetChartedDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  genre: string;

  @ApiProperty({ type: Music })
  @IsNotEmpty()
  @Type(() => Music)
  @ValidateNested()
  musics: Music;
}
