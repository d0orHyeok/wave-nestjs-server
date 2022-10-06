import { UpdateCoverDto } from './dto/update-cover.dto';
import { UploadMusicDto } from './dto/upload-music.dto';
import {
  deleteFileFirebase,
  getBlobFromURL,
  getBufferFromBlob,
  uploadFileFirebase,
} from './../fileFunction';
import { deleteFileDisk, uploadFileDisk } from 'src/fileFunction';
import { UpdateMusicDataDto } from './dto/update-music-data.dto';
import { UploadMusicDataDto } from './dto/upload-music-data.dto';
import { PagingDto } from '../common/dto/paging.dto';
import { AuthService } from './../auth/auth.service';
import { MusicDataDto } from './dto/music-data.dto';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MusicRepository } from 'src/music/music.repository';
import { Music } from 'src/entities/music.entity';
import * as NodeID3 from 'node-id3';
import { extname, resolve } from 'path';
import * as shell from 'shelljs';
import { readFileSync } from 'fs';
import { MulterFile } from 'src/entities/common.types';

@Injectable()
export class MusicService {
  constructor(
    @InjectRepository(MusicRepository)
    private musicRepository: MusicRepository,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async createMusic(createMusicData: MusicDataDto, user: User): Promise<Music> {
    return this.musicRepository.createMusic(createMusicData, user);
  }

  async uploadMusic(uploadMusicDto: UploadMusicDto, user: User) {
    const { music, cover, data } = uploadMusicDto;

    const fileBase = `${Date.now()}_${user.id}_`;

    // 유저가 작성한 음악정보로 파일을 수정
    const { buffer, originalname, mimetype } = this.changeMusicFileData(
      music,
      data,
      cover,
    );

    // 음악파일 및 음악 커버 이미지를 파이어베이스에 저장
    let coverUrl: string | undefined;
    let coverFilename: string | undefined;
    if (cover) {
      const { filename: cFilename, link: cLink } = await uploadFileFirebase(
        cover.buffer,
        cover.mimetype,
        fileBase + cover.originalname,
      );
      coverUrl = cLink;
      coverFilename = cFilename;
    }

    const { filename, link } = await uploadFileFirebase(
      buffer,
      mimetype,
      fileBase + originalname,
    );

    const waveform = await this.generateWaveformData(music);

    const createMusicData = {
      ...data,
      filename,
      link,
      cover: coverUrl,
      coverFilename,
      waveform,
    };

    return this.createMusic(createMusicData, user);
  }

  async getAllMusic(): Promise<Music[]> {
    return this.musicRepository.getAllMusic();
  }

  async getRandomMusics() {
    return this.musicRepository.getRandomMusics();
  }

  async findMusicById(id: number) {
    const music = await this.musicRepository.findMusicById(id);
    const user = await this.authService.findUserById(music.userId);
    return { ...music, user };
  }

  async findMusicByPermalink(userId: string, permalink: string) {
    const music = await this.musicRepository.findMusicByPermalink(
      userId,
      permalink,
    );
    const user = await this.authService.findUserById(music.userId);
    return { ...music, user };
  }

  async findMusicsByIds(musicIds: number[], uid?: string) {
    return this.musicRepository.findMusicByIds(musicIds, uid);
  }

  async findMusicsByUserId(userId: string, pagingDto: PagingDto, uid?: string) {
    return this.musicRepository.findMusicsByUserId(userId, pagingDto, uid);
  }

  async findPopularMusicsByUserId(userId: string, uid?: string) {
    return this.musicRepository.findPopularMusicsByUserId(userId, uid);
  }

  async findRelatedMusic(id: number, pagingDto: PagingDto) {
    // 선택된 음악의 제목, 앨범, 아티스트와 관련있는 음악들을 가져온다
    return this.musicRepository.findRelatedMusic(id, pagingDto);
  }

  async findUsersRelated(user: User) {
    // 유저의 최근 재생기록과 좋아요표시한 음악의 관련음악을 가져온다
    const { historys, likeMusics } = user;
    const ids: number[] = [];
    historys.slice(0, 3).forEach((history) => ids.push(history.musicId));
    likeMusics.slice(0, 3).forEach((music) => ids.push(music.id));
    return ids.length ? this.musicRepository.findRelatedMusicsByIds(ids) : [];
  }

  async searchMusic(keyward: string, pagingDto: PagingDto, uid?: string) {
    return this.musicRepository.searchMusic(keyward, pagingDto, uid);
  }

  async findMusicsByTag(tag: string, pagingDto: PagingDto, uid?: string) {
    return this.musicRepository.findMusicsByTag(tag, pagingDto, uid);
  }

  async findChartedMusics(
    chart: 'trend' | 'newrelease',
    genre?: string | string[],
    date?: number | 'week' | 'month',
  ) {
    if (Array.isArray(genre)) {
      return Promise.all(
        genre.map(async (genre) => {
          const musics =
            chart === 'trend'
              ? await this.musicRepository.findTrendingMusics(genre, date)
              : await this.musicRepository.findNewReleaseMusics(genre, date);
          return { genre, musics };
        }),
      );
    } else {
      return chart === 'trend'
        ? await this.musicRepository.findTrendingMusics(genre, date)
        : await this.musicRepository.findNewReleaseMusics(genre, date);
    }
  }

  changeMusicFileData(
    file: MulterFile,
    data: UploadMusicDataDto,
    image?: MulterFile,
  ) {
    const { description, lyrics } = data;

    let tags: any = {
      title: data.title,
      genre: data.genre,
      artist: data.artist,
      album: data.album,
      performerInfo: data.albumartist,
      composer: data.composer,
      year: data.year,
    };

    if (image) {
      tags = {
        ...tags,
        image: {
          type: { id: 3, name: 'front cover' },
          mime: image.mimetype,
          description: 'album cover',
          imageBuffer: image.buffer,
        },
      };
    }

    if (lyrics) {
      tags = {
        ...tags,
        unsynchronisedLyrics: {
          language: 'kor',
          text: lyrics,
        },
      };
    }

    if (description) {
      tags = {
        ...tags,
        comment: {
          language: 'kor',
          text: description,
        },
      };
    }

    const newBuffer = NodeID3.update(tags, file.buffer);

    return !newBuffer ? file : { ...file, buffer: newBuffer };
  }

  changeMusicData(music: Music, updateMusicDataDto: UpdateMusicDataDto) {
    const chagedMusic = music;
    const entries = Object.entries(updateMusicDataDto);
    entries.forEach((entrie) => {
      const [key, value] = entrie;
      chagedMusic[key] = value;
      if (key === 'genre' || key === 'tags') {
        chagedMusic[`${key}Lower`] = value
          ? value.map((v) => v.toLowerCase())
          : value;
      }
    });
    return chagedMusic;
  }

  async updateMusicData(id: number, updateMusicDataDto: UpdateMusicDataDto) {
    // 음악정보를 가져온다.
    const music = await this.musicRepository.findMusicById(id);
    const changedMusic = this.changeMusicData(music, updateMusicDataDto);

    return this.musicRepository.updateMusic(changedMusic);
  }

  async changeMusicCover(id: number, updateCoverDto: UpdateCoverDto) {
    const { cover: file, data } = updateCoverDto;

    const music = await this.musicRepository.findMusicById(id);
    const { cover, link, filename, coverFilename } = music;
    const fileBase = `${Date.now()}_${music.userId}_`;

    // 음악파일을 가져온다
    const musicBlob = await getBlobFromURL(link);
    if (!musicBlob) {
      throw new InternalServerErrorException('Fail to update');
    }
    const musicBuffer = await getBufferFromBlob(musicBlob);

    // 가져온 음악파일의 커버를 수정한다
    const tags = {
      image: {
        type: { id: 3, name: 'front cover' },
        mime: file.mimetype,
        description: 'album cover',
        imageBuffer: file.buffer,
      },
    };
    const newBuffer = NodeID3.update(tags, musicBuffer);
    if (!newBuffer) {
      throw new InternalServerErrorException('Fail to update');
    }

    // 기존에 존재하던 음악파일을 수정한다.
    const { filename: newFilename, link: newLink } = await uploadFileFirebase(
      newBuffer,
      musicBlob.type,
      filename,
    );
    if (filename) {
      await deleteFileFirebase(filename);
    }

    // 바뀌기 전 음악커버를 삭제한다.
    if (cover) {
      await deleteFileFirebase(coverFilename);
    }

    // 바뀐 음악커버를 저장한다.
    const newCoverName = `${fileBase}_cover${extname(file.originalname)}`;

    const { filename: cFilename, link: cLink } = await uploadFileFirebase(
      file.buffer,
      file.mimetype,
      newCoverName,
    );

    // 바뀐 음악정보들을 업데이트한다.
    music.cover = cLink;
    music.coverFilename = cFilename;
    music.filename = newFilename;
    music.link = newLink;
    const changedMusic = !data ? music : this.changeMusicData(music, data);

    return this.musicRepository.updateMusic(changedMusic);
  }

  async deleteMusic(id: number, user: User): Promise<void> {
    const music = await this.musicRepository.findOne({ id, user });
    if (music) {
      const { filename, coverFilename } = music;
      await deleteFileFirebase(filename);
      if (coverFilename) {
        await deleteFileFirebase(coverFilename);
      }
      return this.musicRepository.deleteMusic(id, user);
    }
  }

  async generateWaveformData(file: MulterFile) {
    // 음악의 파형을 분석하고 데이터를 반환

    // Save music file temporarily
    const tempFilePath = uploadFileDisk(
      file,
      `${Date.now()}${file.originalname.replace(/ /g, '')}`,
      'temp',
    );

    // File name to save waveform data
    const jsonFilename = `${tempFilePath
      .split('.')
      .slice(0, -1)
      .join('.')}.json`;

    // Audiowaveform Command
    const command = await `audiowaveform -i ${resolve(
      tempFilePath,
    )} -o ${resolve(jsonFilename)} --pixels-per-second 20 --bits 8`;

    // Execute command
    const child = shell.exec(command);

    let jsonData = null;
    if (child.code === 0) {
      // If success, read json file
      jsonData = readFileSync(jsonFilename, 'utf8');
      deleteFileDisk(jsonFilename); // Delete temporarily saved json files
    }
    deleteFileDisk(tempFilePath); // Delete temporarily saved music files
    return jsonData;
  }
}
