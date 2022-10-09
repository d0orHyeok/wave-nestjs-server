import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AuthProfileDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(2)
  nickname: string;

  @ApiProperty({
    example: `I'm Happy!`,
    description: '자기소개',
  })
  @IsOptional()
  @IsString()
  description: string;
}
