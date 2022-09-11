import { AuthRegisterDto } from './dto/auth-register.dto';
import { User } from 'src/entities/user.entity';
import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Music } from 'src/entities/music.entity';
import { Playlist } from 'src/entities/playlist.entity';
import { PagingDto } from 'src/common/dto/paging.dto';

type TargetType = Music | Playlist;

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async createUser(authRegisterlDto: AuthRegisterDto): Promise<void> {
    const user = this.create(authRegisterlDto);

    try {
      await this.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing username');
      } else {
        console.log(error);
        throw new InternalServerErrorException(error, 'Error to create user');
      }
    }
  }

  orderSelectQuery(query: SelectQueryBuilder<User>) {
    return query
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(f.id)', 'count')
          .from(User, 'f')
          .where('f.id = followers.id');
      }, 'fcount')
      .orderBy('fcount', 'DESC');
  }

  getSimpleQuery() {
    return this.createQueryBuilder('user')
      .loadRelationCountAndMap('user.followersCount', 'user.followers')
      .loadRelationCountAndMap('user.followingCount', 'user.following')
      .loadRelationCountAndMap('user.playlistsCount', 'user.playlists')
      .loadRelationCountAndMap('user.likeMusicsCount', 'user.likeMusics')
      .loadRelationCountAndMap('user.repostMusicsCount', 'user.repostMusics')
      .loadRelationCountAndMap('user.likePlaylistsCount', 'user.likePlaylists')
      .loadRelationCountAndMap(
        'user.repostPlaylistsCount',
        'user.repostPlaylists',
      )
      .loadRelationCountAndMap('user.commentsCount', 'user.comments')
      .loadRelationCountAndMap('user.musicsCount', 'user.musics');
  }

  getDetailQuery() {
    return this.getSimpleQuery()
      .leftJoinAndSelect('user.musics', 'musics')
      .leftJoinAndSelect('user.playlists', 'playlists')
      .leftJoinAndSelect('playlists.musics', 'pm')
      .leftJoinAndSelect('pm.user', 'pmu')
      .leftJoinAndSelect('user.likeMusics', 'lm')
      .leftJoinAndSelect('user.repostMusics', 'rm')
      .leftJoinAndSelect('user.likePlaylists', 'lp')
      .leftJoinAndSelect('user.repostPlaylists', 'rp')
      .leftJoinAndSelect('lm.user', 'lmu')
      .leftJoinAndSelect('rm.user', 'rmu')
      .leftJoinAndSelect('lp.user', 'lpu')
      .leftJoinAndSelect('rp.user', 'rpu')
      .leftJoinAndSelect('user.followers', 'followers')
      .leftJoinAndSelect('user.following', 'following')
      .loadRelationCountAndMap(
        'followers.followersCount',
        'followers.followers',
      )
      .loadRelationCountAndMap(
        'following.followersCount',
        'following.followers',
      );
  }

  async findUserByUsername(username: string): Promise<User> {
    const user = await this.getDetailQuery()
      .addSelect('user.hashedRefreshToken')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw new BadRequestException({}, `Can't find User with id: ${username}`);
    }

    return user;
  }

  async findUserById(id: string, nullable?: boolean) {
    const user = await this.getDetailQuery()
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      if (nullable) {
        return null;
      } else {
        throw new BadRequestException(`Can't find User with id: ${id}`);
      }
    }

    return user;
  }

  async getRandomUsers() {
    try {
      const ids = (
        await this.createQueryBuilder('user').select('user.id').getMany()
      ).map((value) => value.id);

      const maxLength = ids.length < 4 ? ids.length : 4;
      const randomIds: string[] = [];

      while (randomIds.length < maxLength) {
        const randomIndex = Math.floor(Math.random() * ids.length);
        const item = ids[randomIndex];
        if (!randomIds.includes(item)) {
          randomIds.push(item);
        }
      }

      return this.getSimpleQuery().whereInIds(randomIds).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to get musics');
    }
  }

  async searchUser(keyward: string, pagingDto: PagingDto) {
    const { skip, take } = pagingDto;

    try {
      const query = this.getDetailQuery().where(
        'LOWER(user.nickname) LIKE :nickname',
        {
          nickname: `%${keyward}%`,
        },
      );
      return this.orderSelectQuery(query).skip(skip).take(take).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to search user');
    }
  }

  async updateRefreshToken(user: User, hashedRefreshToken?: string) {
    try {
      await this.createQueryBuilder()
        .update(User)
        .set({ hashedRefreshToken })
        .where('id = :id', { id: user.id })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        'Error to update refreshToken',
      );
    }
  }

  async toggleFollow(user: User, target: User) {
    const following = user.following || [];
    let findIndex = -1;
    const newFollowing = following.filter((f, index) => {
      if (f.id !== target.id) {
        return true;
      } else {
        findIndex = index;
        return false;
      }
    });

    if (findIndex === -1) {
      newFollowing.push(target);
    }
    user.following = newFollowing;

    try {
      await this.save(user);
      return {
        type: findIndex === -1 ? 'follow' : 'unfollow',
        following: newFollowing,
      };
    } catch (error) {
      throw new InternalServerErrorException(error, `Error to update follow`);
    }
  }

  async toggleColumnTarget(
    user: User,
    target: TargetType,
    column: 'like' | 'repost',
  ) {
    const columnName = column + ('title' in target ? 'Musics' : 'Playlists');
    const targetItems: TargetType[] = user[columnName] || [];
    let findIndex = -1;
    const newTargetItems = targetItems.filter((item, index) => {
      if (item.id !== target.id) {
        return true;
      } else {
        findIndex = index;
        return false;
      }
    });

    if (findIndex === -1) {
      newTargetItems.push(target);
    }
    user[columnName] = newTargetItems;

    try {
      await this.save(user);
      return {
        toggleType: findIndex === -1 ? column : `un${column}`,
        [columnName]: newTargetItems,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        `Error to update ${columnName}`,
      );
    }
  }
}
