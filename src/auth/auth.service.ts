import { EmailService } from './../email/email.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { HistoryRepository } from './../history/history.repository';
import { PagingDto } from 'src/common/dto/paging.dto';
import { PlaylistRepository } from './../playlist/playlist.repository';
import { AuthProfileDto } from './dto/auth-profile.dto';
import { deleteFileFirebase, uploadFileFirebase } from 'src/fileFunction';
import { MusicRepository } from 'src/music/music.repository';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { ConfigService } from '@nestjs/config';
import { AuthCredentailDto } from './dto/auth-credential.dto';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';
import { CookieOptions } from 'express';

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
    private emailService: EmailService,
  ) {}

  async signUp(authRegisterDto: AuthRegisterDto): Promise<void> {
    return this.userRepository.createUser(authRegisterDto);
  }

  async validateUser(authCredentailDto: AuthCredentailDto) {
    const { username, password } = authCredentailDto;

    const user = await this.userRepository.findUserByUsername(username);
    await this.comparePassword(password, user.password);
    const historys = await this.historyRepository.findHistorysByUserId(
      user.id,
      { skip: 0, take: 10 },
    );

    return { user, historys };
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<void> {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isMatch) {
      throw new HttpException('Wrong Password', 401);
    }
  }

  getAccessToken(payload: any, expiresIn?: number): string {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_TOKEN_SECREAT'),
      expiresIn: !Boolean(expiresIn)
        ? Number(this.config.get<number>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'))
        : expiresIn,
    });

    return accessToken;
  }

  getRefreshTokenWithCookie(payload: any): {
    refreshToken: string;
    cookieOption: CookieOptions;
  } {
    const expiresIn = Number(
      this.config.get<number>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    );

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECREAT'),
      expiresIn,
    });

    return {
      refreshToken,
      cookieOption: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: expiresIn * 1000,
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

  removeRefreshTokenWithCookie(user: User): CookieOptions {
    this.userRepository.updateRefreshToken(user, null);

    return {
      httpOnly: true,
      maxAge: 0,
      sameSite: 'none',
      secure: true,
    };
  }

  async findUsernameByEmail(email: string) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('user.username')
      .where('user.email = :email', { email })
      .getMany();

    return !users ? null : users.map((user) => user.username);
  }

  async requestChangePassword(username: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw new InternalServerErrorException(`Can't find user`);
    }

    const payload = { username: user.username };
    const token = this.getAccessToken(payload, 600);
    await this.userRepository.updateRefreshToken(user, token + user.password);
    const transporter = this.emailService.createGmailTransporter();
    const mailOptions = {
      from: this.config.get<string>('MAILER_EMAIL'),
      // to: user.email,
      to: user.email,
      subject: '[Wave] Password Change Link',
      html: `
      <div>
      Hello! "${user.nickname || user.username}"
      <br />
      To change your password, click the following link:
      <a href="${this.config.get<string>('CLIENT_URL')}/password?token=${token}"
        >Change password
      </a>
      <input type="hidden" name="token" value=${token} />
    </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, email: user.email };
  }

  async getUserData(userId: string) {
    const user: User = await this.findUserById(userId);
    const historys = await this.historyRepository.findHistorysByUserId(
      user.id,
      {
        skip: 0,
        take: 10,
      },
    );

    return { ...user, historys };
  }

  async getRandomUsers() {
    return this.userRepository.getRandomUsers();
  }

  async findUserById(id: string, nullable?: boolean) {
    return this.userRepository.findUserById(id, nullable);
  }

  async searchUser(keyward: string, pagingDto: PagingDto) {
    return this.userRepository.searchUser(keyward, pagingDto);
  }

  async changeEmail(user: User, email: string) {
    user.email = email;
    await this.userRepository.updateUser(user);
    return email;
  }

  async setPassword(user: User, password: string) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    await this.userRepository.updateUser(user);
  }

  async changePassword(user: User, changePasswordDto: ChangePasswordDto) {
    const { password, newPassword } = changePasswordDto;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: 'Password not matched' };
    }
    await this.setPassword(user, newPassword);

    return { success: true, message: 'Successfully change password!' };
  }

  changeProfileData(user: User, authProfileDto: AuthProfileDto) {
    const changedUser = user;
    const entries = Object.entries(authProfileDto);
    entries.forEach((entrie) => {
      const [key, value] = entrie;
      changedUser[key] = value;
    });
    return changedUser;
  }

  async updateProfileData(user: User, authProfileDto: AuthProfileDto) {
    const changedUser = this.changeProfileData(user, authProfileDto);
    const { nickname, description } = await this.userRepository.updateUser(
      changedUser,
    );
    return { nickname, description };
  }

  async updateProfileImage(
    user: User,
    updateProfileImageDto: UpdateProfileImageDto,
  ) {
    const { image, data } = updateProfileImageDto;

    let profileImageFilename: string | null = null;
    let profileImage: string | null = null;
    const { profileImageFilename: existProfileImage } = user;

    if (image) {
      const imagename = `${user.id}_${Date.now()}`;
      const { filename, link } = await uploadFileFirebase(
        image.buffer,
        image.mimetype,
        imagename,
      );
      profileImageFilename = filename;
      profileImage = link;
    }

    user.profileImage = profileImage;
    user.profileImageFilename = profileImageFilename;
    const changedUser = !data ? user : this.changeProfileData(user, data);
    const updatedUser = await this.userRepository.updateUser(changedUser);

    try {
      if (existProfileImage) {
        await deleteFileFirebase(existProfileImage);
      }
    } catch (error) {
      console.log(error);
    } finally {
      return updatedUser;
    }
  }

  async toggleFollow(userId: string, targetId: string) {
    // 업데이트할 유저정보와 팔로우할 유저정보를 가져온다
    const target = await this.userRepository.findOne(targetId);
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.following', 'following')
      .where('user.id = :userId', { userId })
      .getOne();

    // 타겟 유저를 팔로우 했는지 여부에 따라 following 배열을 수정한다.
    const { following } = user;

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

    // 수정된 following 정보를 저장한다.
    try {
      await this.userRepository.save(user);
      return {
        type: findIndex === -1 ? 'follow' : 'unfollow',
        following: newFollowing,
      };
    } catch (error) {
      throw new InternalServerErrorException(error, `Error to update follow`);
    }
  }

  async toggleColumnTarget(
    userId: string,
    target: { name: 'music' | 'playlist'; id: number },
    column: 'like' | 'repost',
  ) {
    const { name } = target;
    // 업데이트할 column 이름을 설정한다.
    // likeMusics or likePlaylists or repostMusics or repostPlaylists
    const columnName = `${column}${name.replace(/^[a-z]/, (char) =>
      char.toUpperCase(),
    )}s`;

    // 업데이트할 column이 포함된 유저정보와 target정보를 가져온다
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(`user.${columnName}`, columnName)
      .where('user.id = :userId', { userId })
      .getOne();
    const item =
      name === 'music'
        ? await this.musicRepository.findOne(target.id)
        : await this.playlistRepository.findOne(target.id);

    // 업데이트할 column의 데이터를 수정하고 저장한다
    const targetItems: any[] = user[columnName] || [];
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
      newTargetItems.push(item);
    }
    user[columnName] = newTargetItems;

    try {
      await this.userRepository.save(user);
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

  async deleteAccount(user: User) {
    return this.userRepository.deleteUser(user);
  }
}
