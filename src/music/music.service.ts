import { getBlobFromURL, getBufferFromBlob } from './../fileFunction';
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
import { getStorage } from 'firebase-admin/storage';
import * as NodeID3 from 'node-id3';
import * as uuid from 'uuid';
import { extname, resolve } from 'path';
import * as shell from 'shelljs';
import { readFileSync } from 'fs';

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

  async searchMusic(keyward: string, pagingDto: PagingDto, uid?: string) {
    return this.musicRepository.searchMusic(keyward, pagingDto, uid);
  }

  async findMusicsByTag(tag: string, pagingDto: PagingDto, uid?: string) {
    return this.musicRepository.findMusicsByTag(tag, pagingDto, uid);
  }

  async findTrendingMusics(genre?: string, date?: number | 'week' | 'month') {
    return this.musicRepository.findTrendingMusics(genre, date);
  }

  async findNewReleaseMusics(genre?: string, date?: number | 'week' | 'month') {
    return this.musicRepository.findNewReleaseMusics(genre, date);
  }

  changeMusicFileData(
    file: Express.Multer.File,
    data: UploadMusicDataDto,
    image?: Express.Multer.File,
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

  async updateMusicData(id: number, updateMusicDataDto: UpdateMusicDataDto) {
    return this.musicRepository.updateMusicData(id, updateMusicDataDto);
  }

  async changeMusicCover(id: number, file: Express.Multer.File) {
    const music = await this.musicRepository.findMusicById(id);
    const { cover, link, filename } = music;
    const serverUrl = this.configService.get<string>('SERVER_URL');
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
    await this.deleteFileFirebase(filename);
    const { filename: newFilename, link: newLink } =
      await this.uploadFileFirebase(newBuffer, musicBlob.type, filename);

    // 바뀌기 전 음악커버를 삭제한다.
    if (cover) {
      const existCoverPath = `uploads${cover.split('uploads')[1]}`;
      deleteFileDisk(existCoverPath);
    }

    // 바뀐 음악커버를 저장한다.
    const newCoverName = `${fileBase}_cover${extname(file.originalname)}`;
    const newCoverPath =
      serverUrl + '/' + uploadFileDisk(file, newCoverName, 'cover');

    // 바뀐 음악정보들을 업데이트한다.
    music.cover = newCoverPath;
    music.filename = newFilename;
    music.link = newLink;

    return this.musicRepository.updateMusic(music);
  }

  async deleteMusic(id: number, user: User): Promise<void> {
    const music = await this.musicRepository.findOne({ id, user });
    if (music) {
      const { filename, cover } = music;
      await this.deleteFileFirebase(filename);
      if (cover) {
        const path = `uploads/${cover.split('uploads')[1]}`;
        deleteFileDisk(path);
      }
      return this.musicRepository.deleteMusic(id, user);
    }
  }

  async generateWaveformData(file: Express.Multer.File) {
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

  // firebase function
  createPersistentDownloadUrl = (pathToFile, downloadToken) => {
    const bucket = 'wave-f1616.appspot.com';
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
      pathToFile,
    )}?alt=media&token=${downloadToken}`;
  };

  async uploadFileFirebase(
    buffer: Buffer,
    contentType: string,
    filename: string,
  ) {
    const bucket = getStorage().bucket();
    const upload = bucket.file(filename);

    try {
      await upload.save(buffer, {
        contentType: contentType,
      });

      const dowloadToken = uuid.v4();

      await upload.setMetadata({
        metadata: { firebaseStorageDownloadTokens: dowloadToken },
      });

      return {
        filename,
        link: this.createPersistentDownloadUrl(filename, dowloadToken),
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to upload file on firebase\n' + error,
      );
    }
  }

  async deleteFileFirebase(filename: string) {
    try {
      const bucket = getStorage().bucket();
      await bucket.file(filename).delete();
    } catch (err) {
      throw new InternalServerErrorException(
        'Fail to Delete Firebase file',
        err,
      );
    }
  }
}
