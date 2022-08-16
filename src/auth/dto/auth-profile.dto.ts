import { IsOptional, IsString, MinLength } from 'class-validator';

export class AuthProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nickname: string;

  @IsOptional()
  @IsString()
  description: string;
}
