import { UserRepository } from 'src/auth/user.repository';
import { UpdatePlaylistDto } from './dto/updatePlaylistDto';
import { CreatePlaylistDto } from './dto/createPlaylistDto';
import { MusicRepository } from './../music/music.repository';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { PlaylistRepository } from './playlist.repository';
import { PagingDto } from 'src/common/dto/paging.dto';
import { deleteFileDisk, uploadFileDisk } from 'src/fileFunction';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { MulterFile } from 'src/entities/common.types';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(PlaylistRepository)
    private playlistRepository: PlaylistRepository,
    private musicRepository: MusicRepository,
    private userRepository: UserRepository,
    private configService: ConfigService,
  ) {}

  async createPlaylist(user: User, createPlaylistDto: CreatePlaylistDto) {
    const { musicIds } = createPlaylistDto;
    const musics = await this.musicRepository.findMusicByIds(musicIds || []);
    return this.playlistRepository.createPlaylist(
      user,
      createPlaylistDto,
      musics,
    );
  }

  async findPlaylistById(id: number) {
    const playlist = await this.playlistRepository.findPlaylistById(id);
    const user = await this.userRepository.findUserById(playlist.userId);
    return { ...playlist, user };
  }

  async findPlaylistsByIds(playlistIds: number[], uid: string) {
    const query = this.playlistRepository
      .getDetailPlaylistQuery()
      .whereInIds(playlistIds);
    try {
      return this.playlistRepository.filterPrivate(query, uid).getMany();
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error to find playlists');
    }
  }

  async findPlaylistByPermalink(userId: string, permalink: string) {
    const playlist = await this.playlistRepository.findPlaylistByPermalink(
      userId,
      permalink,
    );
    const user = await this.userRepository.findUserById(playlist.userId);
    return { ...playlist, user };
  }

  async findDetailPlaylistsById(
    id: number,
    pagingDto: PagingDto,
    uid?: string,
  ) {
    return this.playlistRepository.findDetailPlaylistsById(id, pagingDto, uid);
  }

  async findPlaylistsByUserId(
    userId: string,
    pagingDto: PagingDto,
    uid?: string,
  ) {
    return this.playlistRepository.findPlaylistsByUserId(
      userId,
      pagingDto,
      uid,
    );
  }

  async searchPlaylist(keyward: string, pagingDto: PagingDto, uid?: string) {
    return this.playlistRepository.searchPlaylist(keyward, pagingDto, uid);
  }

  async findPlaylistsByTag(tag: string, pagingDto: PagingDto, uid?: string) {
    return this.playlistRepository.findPlaylistsByTag(tag, pagingDto, uid);
  }

  async updatePlaylistInfo(
    playlistId: number,
    updatePlaylistDto: UpdatePlaylistDto,
  ) {
    const updatedPlaylist = await this.playlistRepository.updatePlaylistInfo(
      playlistId,
      updatePlaylistDto,
    );
    const user = await this.userRepository.findUserById(updatedPlaylist.userId);
    return { ...updatedPlaylist, user };
  }

  async changePlaylistMusics(id: number, musicIds: number[]) {
    const musics = await this.musicRepository.findMusicByIds(musicIds);
    const orderedMusics = musicIds.map((id) =>
      musics.find((music) => music.id === id),
    );
    const playlist = await this.playlistRepository.changePlaylistMusics(
      id,
      orderedMusics,
    );
    return playlist.musics;
  }

  async addMusicToPlaylist(playlistId: number, musicIds: number[]) {
    const musics = await this.musicRepository.findMusicByIds(musicIds);
    return this.playlistRepository.addMusicToPlaylist(playlistId, musics);
  }

  async changePlaylistImage(playlistId: number, file: MulterFile) {
    const playlist = await this.playlistRepository.findPlaylistById(playlistId);
    const { image } = playlist;
    const serverUrl = this.configService.get<string>('SERVER_URL');

    // 바뀌기 전 음악커버를 삭제한다.
    if (image) {
      const existImagePath = `uploads${image.split('uploads')[1]}`;
      deleteFileDisk(existImagePath);
    }

    // 바뀐 음악커버를 저장한다.
    const newImageName = `${Date.now()}_${playlist.permalink}_image${extname(
      file.originalname,
    )}`;
    const newImagePath =
      serverUrl + '/' + uploadFileDisk(file, newImageName, 'playlist');

    // 바뀐 음악정보들을 업데이트한다.
    playlist.image = newImagePath;

    const result = await this.playlistRepository.updatePlaylist(playlist);
    const user = await this.userRepository.findUserById(playlist.userId);
    return { ...result, user };
  }

  async deletePlaylist(playlistId: number, user: User) {
    const playlist = await this.playlistRepository.findPlaylistById(playlistId);
    if (!playlist) return;

    const { image } = playlist;
    if (image) {
      const path = `uploads/${image.split('uploads')[1]}`;
      deleteFileDisk(path);
    }

    return this.playlistRepository.deletePlaylist(playlistId, user);
  }
}
