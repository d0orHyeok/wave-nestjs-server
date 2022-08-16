import { CommentService } from './comment.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/entities/user.entity';
import { GetUser } from 'src/decorators/get-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get('/user/:userId')
  async getCommentsByUserId(@Param('userId') userId: string) {
    return this.commentService.findCommentsByUserId(userId);
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @GetUser() user: User,
    @Body(ValidationPipe) createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.createComment(user, createCommentDto);
  }

  @Delete('/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(@Param('commentId') commentId: number) {
    return this.commentService.deleteComment(commentId);
  }
}
