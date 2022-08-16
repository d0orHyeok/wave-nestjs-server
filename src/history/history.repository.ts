import { PagingDto } from './../common/dto/paging.dto';
import { EntityRepository, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Music } from 'src/entities/music.entity';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { History } from 'src/entities/history.entity';

@EntityRepository(History)
export class HistoryRepository extends Repository<History> {
  getDetailQuery() {
    return this.createQueryBuilder('history')
      .leftJoinAndSelect('history.user', 'user')
      .leftJoinAndSelect('history.music', 'music')
      .leftJoinAndSelect('music.user', 'hmu')
      .leftJoinAndSelect('music.likes', 'hml')
      .loadRelationCountAndMap('music.likesCount', 'music.likes')
      .loadRelationCountAndMap('music.commentsCount', 'music.comments')
      .loadRelationCountAndMap('music.playlistsCount', 'music.playlists')
      .loadRelationCountAndMap('music.repostsCount', 'music.reposts')
      .loadRelationCountAndMap('music.count', 'music.history');
  }

  async findHistorysByUserId(userId: string, pagingDto: PagingDto) {
    const { skip, take } = pagingDto;

    try {
      return this.getDetailQuery()
        .where('history.userId = :userId', {
          userId,
        })
        .andWhere((qb) => {
          const subQuery = qb.connection
            .createQueryBuilder()
            .select('h.musicId')
            .addSelect('MAX(h.createdAt)', 'createdAt')
            .from(History, 'h')
            .groupBy('h.musicId')
            .getQuery();
          return `(history.musicId, history.createdAt) IN (${subQuery})`;
        })
        .orderBy('history.createdAt', 'DESC')
        .skip(skip)
        .take(take)
        .getMany();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error, 'Error to get history');
    }
  }

  async createHistory(user: User, music: Music) {
    const history = this.create({ user, music });

    try {
      await this.save(history);
      return history;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        error,
        `Error ocuur create history.`,
      );
    }
  }

  async clearHistory(user: User) {
    try {
      const historys = await this.getDetailQuery()
        .where('history.userId = :userId', { userId: user.id })
        .getMany();

      const clearedHistory = historys.map((history) => {
        return { ...history, user: null, userId: null };
      });

      await this.save(clearedHistory);

      return;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        error,
        `Error to clear userId:"${user.id}" history`,
      );
    }
  }

  async deleteHistory(historyId: number) {
    try {
      const result = await this.delete({ id: historyId });
      if (result.affected === 0) {
        throw new NotFoundException(`Can't find history with id ${historyId}`);
      }
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to delete history');
    }
  }
}
