import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentRepository } from './comment.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MusicRepository } from 'src/music/music.repository';
import { User } from 'src/entities/user.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentRepository)
    private commentRepository: CommentRepository,
    private musicRepository: MusicRepository,
  ) {}

  async findCommentsByUserId(userId: string) {
    return this.commentRepository.findCommentsByUserId(userId);
  }

  async createComment(user: User, createCommentDto: CreateCommentDto) {
    const music = await this.musicRepository.findMusicById(
      createCommentDto.musicId,
    );
    return this.commentRepository.createComment(user, music, createCommentDto);
  }

  async deleteComment(commentId: number) {
    return this.commentRepository.deleteComment(commentId);
  }
}
