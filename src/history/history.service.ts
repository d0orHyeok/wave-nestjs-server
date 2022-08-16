import { PagingDto } from './../common/dto/paging.dto';
import { CreateHistoryDto } from './dto/create-history.dto';
import { AuthService } from './../auth/auth.service';
import { HistoryRepository } from './history.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MusicRepository } from 'src/music/music.repository';
import { User } from 'src/entities/user.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryRepository)
    private historytRepository: HistoryRepository,
    private musicRepository: MusicRepository,
    private authService: AuthService,
  ) {}

  async createHistory(createHistoryDto: CreateHistoryDto) {
    const { musicId, userId } = createHistoryDto;

    const user = await this.authService.findUserById(userId, true);
    const music = await this.musicRepository.findMusicById(musicId);

    return this.historytRepository.createHistory(user, music);
  }

  async findHistorysByUserId(userId: string, pagingDto: PagingDto) {
    return this.historytRepository.findHistorysByUserId(userId, pagingDto);
  }

  async clearHistory(user: User) {
    return this.historytRepository.clearHistory(user);
  }
}
