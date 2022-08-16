import { PagingDto } from './common/dto/paging.dto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PlaylistRepository } from './playlist/playlist.repository';
import { MusicRepository } from './music/music.repository';
import { UserRepository } from './auth/user.repository';

@Injectable()
export class AppService {
  constructor(
    private playlistRepository: PlaylistRepository,
    private musicRepository: MusicRepository,
    private userRepository: UserRepository,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async searchAll(keyward: string, pagingDto: PagingDto, uid?: string) {
    try {
      const musics = await this.musicRepository.searchMusic(
        keyward,
        pagingDto,
        uid,
      );
      const users = await this.userRepository.searchUser(keyward, pagingDto);
      const playlists = await this.playlistRepository.searchPlaylist(
        keyward,
        pagingDto,
      );

      const items = [...musics, ...users, ...playlists];

      const sortedArray = items.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      return sortedArray;
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        `Error to search musics, playlists, users`,
      );
    }
  }
}
