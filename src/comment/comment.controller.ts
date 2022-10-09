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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Comment } from 'src/entities/comment.entity';

@ApiTags('Comment API')
@ApiBadRequestResponse({
  status: 400,
  description: '잘못된 파라미터',
})
@ApiUnauthorizedResponse({
  status: 401,
  description: '비인증',
})
@ApiInternalServerErrorResponse({
  status: 500,
  description: '서버 로직 문제',
})
@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @ApiOperation({ summary: '유저 댓글 조회 API' })
  @ApiResponse({
    status: 200,
    description: '유저가 작성한 댓글들을 조회한다.',
    type: Comment,
    isArray: true,
  })
  @Get('/user/:userId')
  async getCommentsByUserId(@Param('userId') userId: string) {
    return this.commentService.findCommentsByUserId(userId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글작성 API' })
  @ApiResponse({ status: 201, description: '댓글작성 성공', type: Comment })
  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @GetUser() user: User,
    @Body(ValidationPipe) createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.createComment(user, createCommentDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글삭제 API' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @ApiBearerAuth()
  @Delete('/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(@Param('commentId') commentId: number) {
    return this.commentService.deleteComment(commentId);
  }
}
