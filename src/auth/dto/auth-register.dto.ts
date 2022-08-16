import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthRegisterDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  username: string;

  @IsString()
  password: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  nickname: string;
}
