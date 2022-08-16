import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AuthCredentailDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/(?=.*[a-z|A-Z])(?=.*[0-9])[a-zA-Z0-9#?!@$%^&*-]{6,20}$/, {
    message: 'password only accepts english, number and special',
  })
  password: string;
}
