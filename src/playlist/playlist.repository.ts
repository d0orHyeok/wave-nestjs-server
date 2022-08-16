import { UpdatePlaylistDto } from './dto/updatePlaylistDto';
import { CreatePlaylistDto } from './dto/createPlaylistDto';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { Playlist } from './../entities/playlist.entity';
import {
  Brackets,
  EntityRepository,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Music } from 'src/entities/music.entity';
import { PagingDto } from 'src/common/dto/paging.dto';

@EntityRepository(Playlist)
export class PlaylistRepository extends Repository<Playlist> {
  orderSelectQuery(query: SelectQueryBuilder<Playlist>) {
    return query
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(l.id)', 'count')
          .from(User, 'l')
          .where('l.id = likes.id');
      }, 'lcount')
      .orderBy('lcount', 'DESC');
  }

  getDetailPlaylistQuery() {
    return this.createQueryBuilder('playlist')
      .leftJoinAndSelect('playlist.user', 'user')
      .leftJoinAndSelect('playlist.musics', 'musics')
      .leftJoinAndSelect('musics.user', 'pmu')
      .leftJoinAndSelect('playlist.likes', 'likes')
      .leftJoinAndSelect('playlist.reposts', 'reposts')
      .loadRelationCountAndMap('playlist.musicsCount', 'playlist.musics')
      .loadRelationCountAndMap('playlist.likesCount', 'playlist.likes')
      .loadRelationCountAndMap('playlist.repostsCount', 'playlist.reposts')
      .loadRelationCountAndMap('musics.count', 'musics.history');
  }

  async createPlaylist(
    user: User,
    createPlaylistDto: CreatePlaylistDto,
    musics: Music[],
  ) {
    const { name: permalink, status } = createPlaylistDto;

    const findPlaylist = await this.findOne({ user, permalink });

    const playlist = this.create({
      status,
      name: permalink,
      permalink: !findPlaylist ? permalink : `${permalink}_${Date.now()}`,
      user,
      musics,
    });

    try {
      const result = await this.save(playlist);
      return result;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing playlist');
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          error,
          'Error to create playlist',
        );
      }
    }
  }

  filterPrivate(query: SelectQueryBuilder<Playlist>, uid?: string) {
    return query.andWhere(
      new Brackets((qb) => {
        const query = qb.where('playlist.status = :status', {
          status: 'PUBLIC',
        });

        return !uid
          ? query
          : query.orWhere('playlist.status = :st AND playlist.userId = :uid', {
              st: 'PRIVATE',
              uid,
            });
      }),
    );
  }

  async findPlaylistById(playlistId: number) {
    const playlist = await this.getDetailPlaylistQuery()
      .where('playlist.id = :id', { id: playlistId })
      .getOne();

    if (!playlist) {
      throw new NotFoundException(`Can't find playlist with id ${playlistId}`);
    }
    return playlist;
  }

  async findPlaylistByPermalink(userId: string, permalink: string) {
    const playlist = await this.getDetailPlaylistQuery()
      .where('user.id = :userId', { userId })
      .andWhere('playlist.permalink = :permalink', { permalink })
      .getOne();

    if (!playlist) {
      throw new NotFoundException(
        `Can't find ${userId}'s playlist permalink: ${permalink}`,
      );
    }

    return playlist;
  }

  async findDetailPlaylistsById(
    id: number,
    pagingDto: PagingDto,
    uid?: string,
  ) {
    const { skip, take } = pagingDto;

    try {
      const query = this.createQueryBuilder('playlist')
        .leftJoinAndSelect('playlist.musics', 'musics')
        .select('playlist.id')
        .where('musics.id = :musicsid', { musicsid: id });
      const result = await this.filterPrivate(query, uid)
        .skip(skip)
        .take(take)
        .getMany();
      const playlistIds = result.map((value) => value.id);
      return this.getDetailPlaylistQuery().whereInIds(playlistIds).getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        'Error to get detail playlists',
      );
    }
  }

  async findPlaylistsByUserId(
    userId: string,
    pagingDto: PagingDto,
    uid?: string,
  ) {
    const { skip, take } = pagingDto;

    try {
      const query = this.getDetailPlaylistQuery().where(
        'playlist.userId = :userId',
        { userId },
      );
      return this.filterPrivate(query, uid)
        .orderBy('playlist.createdAt', 'DESC')
        .skip(skip)
        .take(take)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        'Error to get detail playlists',
      );
    }
  }

  async searchPlaylist(keyward: string, pagingDto: PagingDto, uid?: string) {
    const { skip, take } = pagingDto;

    const whereString = `%${keyward.toLocaleLowerCase()}%`;

    try {
      let query = this.getDetailPlaylistQuery()
        .where('LOWER(playlist.name) LIKE :name', { name: whereString })
        .orWhere('LOWER(user.nickname) LIKE :nickname', {
          nickname: whereString,
        });
      query = this.filterPrivate(query, uid);
      return this.orderSelectQuery(query).skip(skip).take(take).getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        'Error to search playlists',
      );
    }
  }

  async findPlaylistsByTag(tag: string, pagingDto: PagingDto, uid?: string) {
    const { skip, take } = pagingDto;

    try {
      let query = this.getDetailPlaylistQuery()
        .addSelect('playlist.tagsLower')
        .where('playlist.tagsLower IN (:tag)', {
          tag: [tag.toLowerCase()],
        });
      query = this.filterPrivate(query, uid);

      return this.orderSelectQuery(query).skip(skip).take(take).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, `Error to find playlists`);
    }
  }

  async updatePlaylist(playlist: Playlist) {
    try {
      return this.save(playlist);
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        'Error to update playlist info',
      );
    }
  }

  async updatePlaylistInfo(
    playlistId: number,
    updatePlaylistDto: UpdatePlaylistDto,
  ) {
    const playlist = await this.findPlaylistById(playlistId);
    Object.entries(updatePlaylistDto).forEach((entrie) => {
      const [key, value] = entrie;
      if (value) {
        playlist[key] = value;
        if (key === 'tags') {
          playlist['tagsLower'] = value.map((t) => t.toLowerCase());
        }
      }
    });

    return this.updatePlaylist(playlist);
  }

  async addMusicToPlaylist(playlistId: number, musics: Music[]) {
    const playlist = await this.findPlaylistById(playlistId);
    const existMusics = playlist.musics;
    playlist.musics = [...existMusics, ...musics];

    return this.updatePlaylist(playlist);
  }

  async changePlaylistMusics(id: number, musics: Music[]) {
    const playlist = await this.findPlaylistById(id);
    playlist.musics = musics;

    return this.updatePlaylist(playlist);
  }

  async deletePlaylist(id: number, user: User): Promise<void> {
    try {
      const result = await this.delete({ id, user });
      if (result.affected === 0) {
        throw new NotFoundException(`Can't find Playlist with id ${id}`);
      }
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to delete playlist');
    }
  }
}
