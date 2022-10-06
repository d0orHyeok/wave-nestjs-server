import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  password: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/(?=.*[a-z|A-Z])(?=.*[0-9])[a-zA-Z0-9#?!@$%^&*-]{6,20}$/, {
    message: 'newPassword only accepts english, number and special',
  })
  newPassword: string;
}
