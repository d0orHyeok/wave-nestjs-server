import { HistoryRepository } from './../history/history.repository';
import { PagingDto } from 'src/common/dto/paging.dto';
import { PlaylistRepository } from './../playlist/playlist.repository';
import { AuthProfileDto } from './dto/auth-profile.dto';
import { deleteFileDisk, uploadFileDisk } from 'src/fileFunction';
import { MusicRepository } from 'src/music/music.repository';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { ConfigService } from '@nestjs/config';
import { AuthCredentailDto } from './dto/auth-credential.dto';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';
import { CookieOptions } from 'express';
import { extname } from 'path';
import { MulterFile } from 'src/entities/common.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private musicRepository: MusicRepository,
    private playlistRepository: PlaylistRepository,
    private historyRepository: HistoryRepository,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(authRegisterDto: AuthRegisterDto): Promise<void> {
    return this.userRepository.createUser(authRegisterDto);
  }

  async validateUser(authCredentailDto: AuthCredentailDto): Promise<User> {
    const { username, password } = authCredentailDto;

    const user = await this.userRepository.findUserByUsername(username);
    await this.comparePassword(password, user.password);

    return user;
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<void> {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Wrong Password');
    }
  }

  getAccessToken(payload: any): string {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_TOKEN_SECREAT'),
      expiresIn: Number(
        this.config.get<number>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      ),
    });

    return accessToken;
  }

  getRefreshTokenWithCookie(payload: any): {
    refreshToken: string;
    cookieOption: CookieOptions;
  } {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECREAT'),
      expiresIn: Number(
        this.config.get<number>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
      ),
    });

    return {
      refreshToken,
      cookieOption: {
        httpOnly: true,
      },
    };
  }

  async setCurrentRefreshToken(
    refreshToken: string,
    user: User,
  ): Promise<void> {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.userRepository.updateRefreshToken(user, hashedRefreshToken);
  }

  async compareRefreshToken(
    refreshToken: string,
    hashedRefreshToken: string,
  ): Promise<void> {
    try {
      const isMatch = await bcrypt.compare(refreshToken, hashedRefreshToken);
      if (!isMatch) {
        throw new UnauthorizedException(
          'RefreshToken is not match\nPlease SignIn again',
        );
      }
    } catch (error) {
      throw new UnauthorizedException(
        error,
        'Error to compareRefrshToken, please sign in again',
      );
    }
  }

  async removeRefreshTokenWithCookie(user: User): Promise<CookieOptions> {
    await this.userRepository.updateRefreshToken(user, null);

    return {
      httpOnly: true,
      maxAge: 0,
    };
  }

  async getRandomUsers() {
    return this.userRepository.getRandomUsers();
  }

  async getRecentHistory(userId: string) {
    return this.historyRepository.findHistorysByUserId(userId, {
      skip: 0,
      take: 10,
    });
  }

  async findUserById(id: string, nullable?: boolean) {
    return this.userRepository.findUserById(id, nullable);
  }

  async searchUser(keyward: string, pagingDto: PagingDto) {
    return this.userRepository.searchUser(keyward, pagingDto);
  }

  async updateProfileImage(user: User, image: MulterFile) {
    const filename = `${user.id}_${Date.now()}`;
    const imageUrl =
      this.config.get<string>('SERVER_URL') +
      '/' +
      uploadFileDisk(
        image,
        `${filename}${extname(image.originalname)}`,
        'profile',
      );

    const existProfileImage = user.profileImage;
    user.profileImage = imageUrl;

    try {
      await this.userRepository.save(user);
      deleteFileDisk(existProfileImage);
      return imageUrl;
    } catch (error) {
      deleteFileDisk(imageUrl);
      throw new InternalServerErrorException(error);
    }
  }

  async deleteProfileImage(user: User) {
    const imagelink = user.profileImage;
    deleteFileDisk(imagelink);
    user.profileImage = null;
    await this.userRepository.save(user);
  }

  async updateProfileData(user: User, authProfileDto: AuthProfileDto) {
    const { nickname, description } = authProfileDto;
    if (nickname) user.nickname = nickname;
    user.description = description;
    const updateUser = await this.userRepository.save(user);
    return {
      nickname: updateUser.nickname,
      description: updateUser.description,
    };
  }
  async toggleFollow(user: User, targetId: string) {
    const target = await this.userRepository.findUserById(targetId);
    return this.userRepository.toggleFollow(user, target);
  }

  async toggleColumnMusic(
    user: User,
    musicId: number,
    column: 'like' | 'repost',
  ) {
    const music = await this.musicRepository.findMusicById(musicId);
    return this.userRepository.toggleColumnTarget(user, music, column);
  }

  async toggleColumnPlaylist(
    user: User,
    playlistId: number,
    column: 'like' | 'repost',
  ) {
    const playlist = await this.playlistRepository.findPlaylistById(playlistId);
    return this.userRepository.toggleColumnTarget(user, playlist, column);
  }
}
