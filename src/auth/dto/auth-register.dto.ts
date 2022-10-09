import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthRegisterDto {
  @ApiProperty({
    required: true,
    description: '아이디',
    minLength: 6,
    maxLength: 20,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  username: string;

  @ApiProperty({ required: true, minLength: 6, maxLength: 20 })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/(?=.*[a-z|A-Z])(?=.*[0-9])[a-zA-Z0-9#?!@$%^&*-]{6,20}$/, {
    message: 'password only accepts english, number and special',
  })
  password: string;

  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nickname: string;
}
