import { IsNumber, IsOptional } from 'class-validator';

export class PagingDto {
  @IsOptional()
  @IsNumber()
  take?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;
}
