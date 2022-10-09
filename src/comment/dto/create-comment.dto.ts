import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ required: true, example: 'nice music!', description: '댓글' })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  musicId: number;

  @ApiProperty({ description: '댓글이 작성이 요청된 음악재생시간' })
  @IsOptional()
  @IsNumber()
  commentedAt?: number;
}
