import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHistoryDto {
  @IsOptional()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  musicId: number;
}
