import { UpdateMusicDataDto } from './dto/update-music-data.dto';
import { PagingDto } from './../common/dto/paging.dto';
import { MusicDataDto } from './dto/music-data.dto';
import { User } from 'src/entities/user.entity';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Music } from 'src/entities/music.entity';
import {
  Brackets,
  EntityRepository,
  NotBrackets,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { History } from 'src/entities/history.entity';

@EntityRepository(Music)
export class MusicRepository extends Repository<Music> {
  getDate(dateAgo: number | 'week' | 'month') {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    const day = today.getDay();

    if (dateAgo === 'month') {
      return new Date(year, month - 1, 1);
    } else {
      const subDate = dateAgo !== 'week' ? dateAgo : day === 0 ? 7 : day;
      return new Date(year, month, date - subDate);
    }
  }

  orderSelectQuery(
    query: SelectQueryBuilder<Music>,
    dateOption?: number | 'week' | 'month',
  ) {
    const q = query
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(l.id)', 'count')
          .from(User, 'l')
          .where('l.id = likes.id');
      }, 'lcount')
      .addSelect((subQuery) => {
        const sq = subQuery
          .select('COUNT(h.id)', 'count')
          .from(History, 'h')
          .where('h.musicId = music.id');

        return dateOption
          ? sq.andWhere('h.createdAt >= :date', {
              date: this.getDate(dateOption),
            })
          : sq;
      }, 'playcount')
      .orderBy('playcount', 'DESC');

    return dateOption ? q : q.addOrderBy('lcount', 'DESC');
  }

  musicSimpleQuery() {
    return this.createQueryBuilder('music')
      .leftJoinAndSelect('music.user', 'user')
      .leftJoinAndSelect('music.likes', 'likes')
      .loadRelationCountAndMap('music.likesCount', 'music.likes')
      .loadRelationCountAndMap('music.commentsCount', 'music.comments')
      .loadRelationCountAndMap('music.playlistsCount', 'music.playlists')
      .loadRelationCountAndMap('music.repostsCount', 'music.reposts')
      .loadRelationCountAndMap('music.count', 'music.history')
      .loadRelationCountAndMap('user.followersCount', 'user.followers')
      .loadRelationCountAndMap('user.musicsCount', 'user.musics');
  }

  musicDetailQuery() {
    return this.createQueryBuilder('music')
      .leftJoinAndSelect('music.user', 'user')
      .leftJoinAndSelect('music.playlists', 'playlists')
      .leftJoinAndSelect('playlists.user', 'pu')
      .leftJoinAndSelect('music.likes', 'likes')
      .leftJoinAndSelect('music.reposts', 'reposts')
      .leftJoinAndSelect('music.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'cu')
      .loadRelationCountAndMap('music.likesCount', 'music.likes')
      .loadRelationCountAndMap('likes.followersCount', 'likes.followers')
      .loadRelationCountAndMap('reposts.followersCount', 'reposts.followers')
      .loadRelationCountAndMap('cu.followersCount', 'cu.followers')
      .loadRelationCountAndMap('music.commentsCount', 'music.comments')
      .loadRelationCountAndMap('music.playlistsCount', 'music.playlists')
      .loadRelationCountAndMap('music.repostsCount', 'music.reposts')
      .loadRelationCountAndMap('music.count', 'music.history');
  }

  // Create
  async createMusic(createMusicData: MusicDataDto, user: User): Promise<Music> {
    const { permalink, tags, genre } = createMusicData;

    const existMusics = await this.findOne({ permalink, user });

    const music = this.create({
      ...createMusicData,
      permalink: !existMusics ? permalink : `${permalink}_${Date.now()}`,
      genreLower: genre ? genre.map((g) => g.toLowerCase()) : genre,
      tagsLower: tags ? tags.map((t) => t.toLowerCase()) : tags,
      user,
    });

    try {
      await this.save(music);
      return music;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        error,
        `Error ocuur create music.`,
      );
    }
  }

  // Find
  filterPrivate(query: SelectQueryBuilder<Music>, uid?: string) {
    return query.andWhere(
      new Brackets((qb) => {
        const query = qb.where('music.status = :status', {
          status: 'PUBLIC',
        });

        return !uid
          ? query
          : query.orWhere('music.status = :st AND music.userId = :uid', {
              st: 'PRIVATE',
              uid,
            });
      }),
    );
  }

  async getAllMusic(): Promise<Music[]> {
    try {
      return this.musicSimpleQuery().getMany();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error, 'Error to get musics');
    }
  }

  async getRandomMusics() {
    try {
      const query = this.createQueryBuilder('music').select('music.id');
      const ids = (await this.filterPrivate(query).getMany()).map(
        (value) => value.id,
      );

      const maxLength = ids.length < 10 ? ids.length : 10;
      const randomIds: number[] = [];

      while (randomIds.length < maxLength) {
        const randomIndex = Math.floor(Math.random() * ids.length);
        const item = ids[randomIndex];
        if (!randomIds.includes(item)) {
          randomIds.push(item);
        }
      }

      return this.musicSimpleQuery().whereInIds(randomIds).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to get musics');
    }
  }

  async findMusicById(id: number): Promise<Music> {
    const music = await this.musicDetailQuery()
      .where('music.id = :id', { id })
      .getOne();

    if (!music) {
      throw new NotFoundException(`Can't find Music with id ${id}`);
    }

    return music;
  }

  async findMusicByPermalink(userId: string, permalink: string) {
    try {
      const music = await this.musicDetailQuery()
        .where('user.id = :userId', { userId })
        .andWhere('music.permalink = :permalink', { permalink })
        .getOne();

      if (!music) {
        throw new NotFoundException(
          `Can't find ${userId}'s music name: ${permalink}`,
        );
      }

      return music;
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to get music');
    }
  }

  async findMusicByIds(musicIds: number[], uid?: string) {
    const query = this.musicSimpleQuery().whereInIds(musicIds);
    return this.filterPrivate(query, uid).getMany();
  }

  async findRelatedMusic(id: number, musicPagingDto: PagingDto) {
    const music = await this.findMusicById(id);

    const { title, artist } = music;
    const nickname = music.user.nickname;
    const { skip, take } = musicPagingDto;

    try {
      return this.musicSimpleQuery()
        .where('music.id != :id', { id: music.id })
        .andWhere(
          new Brackets((qb) => {
            let query = qb.where('LOWER(music.title) LIKE LOWER(:title)', {
              title: `%${title}%`,
            });
            if (artist && artist.length) {
              query = query.orWhere(`LOWER(music.artist) LIKE LOWER(:artist)`, {
                artist: `%${artist}%`,
              });
            }
            if (nickname) {
              query = query.orWhere(
                `LOWER(user.nickname) Like LOWER(:nickname)`,
                {
                  nickname: `%${nickname}%`,
                },
              );
            }
            return query;
          }),
        )
        .andWhere('music.status = :status', { status: 'PUBLIC' })
        .skip(skip)
        .take(take)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        `Error to get related musics`,
      );
    }
  }

  async findRelatedMusicsByIds(ids: number[]) {
    const musics = await this.findMusicByIds(ids);

    const titleWhere: string[] = [];
    const nicknameWhere: string[] = [];
    const titles = musics.map((music, index) => {
      titleWhere.push(`LOWER(music.title) LIKE LOWER(:${index})`);
      return `%${music.title}%`;
    });
    const nicknames = musics.map((music, index) => {
      nicknameWhere.push(`LOWER(user.nickname) LIKE LOWER(:nickname${index})`);
      return `%${music.user.nickname || music.user.username}%`;
    });

    try {
      return this.musicSimpleQuery()
        .where(new NotBrackets((qb) => qb.whereInIds(ids)))
        .andWhere(
          new Brackets((qb) => {
            const titleQuery = titleWhere.reduce((a, b) => `${a} OR ${b}`);
            const nicknameQuery = nicknameWhere.reduce(
              (a, b) => `${a} OR ${b}`,
            );
            return qb
              .where(titleQuery, { ...titles })
              .orWhere(nicknameQuery, { ...nicknames });
          }),
        )
        .andWhere('music.status = :status', { status: 'PUBLIC' })
        .skip(0)
        .take(30)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        `Error to get related musics`,
      );
    }
  }

  async findMusicsByUserId(userId: string, pagingDto: PagingDto, uid?: string) {
    const { skip, take } = pagingDto;

    const query = this.musicDetailQuery().where('music.userId = :userId', {
      userId,
    });

    try {
      return this.filterPrivate(query, uid)
        .orderBy('music.createdAt', 'DESC')
        .skip(skip)
        .take(take)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to get musics');
    }
  }

  async findPopularMusicsByUserId(userId: string, uid?: string) {
    const minCount = 9;
    let query = this.musicDetailQuery()
      .where('music.userId = :userId', {
        userId,
      })
      .andWhere(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .select('COUNT(h.id)', 'count')
            .from(History, 'h')
            .getQuery();
          return `${subQuery} > :minCount`;
        },
        { minCount },
      );
    query = this.filterPrivate(query, uid);

    try {
      return this.orderSelectQuery(query).take(10).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to get musics');
    }
  }

  async searchMusic(keyward: string, pagingDto: PagingDto, uid?: string) {
    const { skip, take } = pagingDto;

    try {
      let query = this.musicSimpleQuery()
        .where('LOWER(music.title) LIKE LOWER(:title)', {
          title: `%${keyward}%`,
        })
        .orWhere('LOWER(user.nickname) LIKE LOWER(:nickname)', {
          nickname: `%${keyward}%`,
        });
      query = this.filterPrivate(query, uid);
      return this.orderSelectQuery(query).skip(skip).take(take).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, `Error to search musics`);
    }
  }

  async findMusicsByTag(tag: string, pagingDto: PagingDto, uid?: string) {
    const { skip, take } = pagingDto;

    const searchArray = [tag.toLowerCase()];

    try {
      let query = this.musicSimpleQuery()
        .addSelect('music.genreLower')
        .addSelect('music.tagsLower')
        .where('music.genreLower IN (:genre) OR music.tagsLower IN (:tag)', {
          genre: searchArray,
          tag: searchArray,
        });
      query = this.filterPrivate(query, uid);
      return this.orderSelectQuery(query).skip(skip).take(take).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, `Error to search musics`);
    }
  }

  async findTrendingMusics(genre?: string, date?: number | 'week' | 'month') {
    try {
      let query = this.musicSimpleQuery().where('music.status = :status', {
        status: 'PUBLIC',
      });
      query = genre
        ? query.andWhere('music.genre IN (:genre)', { genre: [genre] })
        : query;
      return this.orderSelectQuery(query, date || 'week')
        .take(100)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to get musics');
    }
  }

  async findNewReleaseMusics(genre?: string, date?: number | 'week' | 'month') {
    try {
      let query = this.musicSimpleQuery()
        .where('music.createdAt >= :date', {
          date: this.getDate(date || 'week'),
        })
        .andWhere('music.status = :status', {
          status: 'PUBLIC',
        });
      query = genre
        ? query.andWhere('music.genre IN (:genre)', { genre: [genre] })
        : query;
      return this.orderSelectQuery(query).take(100).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to get musics');
    }
  }

  // Update
  async updateMusic(music: Music) {
    try {
      await this.save(music);
      return music;
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        `Error to update music, music ID: ${music.id}`,
      );
    }
  }

  async updateMusicData(id: number, updateMusicDataDto: UpdateMusicDataDto) {
    const music = await this.findMusicById(id);
    const entries = Object.entries(updateMusicDataDto);
    entries.forEach((entrie) => {
      const [key, value] = entrie;
      music[key] = value;
      if (key === 'genre' || key === 'tags') {
        music[`${key}Lower`] = value
          ? value.map((v) => v.toLowerCase())
          : value;
      }
    });

    return this.updateMusic(music);
  }

  // Delete
  async deleteMusic(id: number, user: User): Promise<void> {
    try {
      const result = await this.delete({ id, user });
      if (result.affected === 0) {
        throw new NotFoundException(`Can't find Music with id ${id}`);
      }
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to delete music');
    }
  }
}
