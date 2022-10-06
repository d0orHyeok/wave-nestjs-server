import { EmailDto } from './dto/email.dto';
import { AuthFindPipe } from './pipes/auth-find.pipe';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileImagePipe } from './pipes/update-profile-image.pipe';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { AuthProfileDto } from './dto/auth-profile.dto';
import { AuthRegisterPipe } from './pipes/auth-register.pipe';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwTRefreshGuard } from './guards/jwt-refresh.guard';
import { AuthService } from './auth.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthCredentailDto } from './dto/auth-credential.dto';
import { GetUser } from 'src/decorators/get-user.decorator';
import { User } from 'src/entities/user.entity';
import { Response } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CheckTargetPipe } from './pipes/check-target.pipe';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @UsePipes(AuthRegisterPipe)
  async signUp(
    @Body(ValidationPipe) authRegisterDto: AuthRegisterDto,
  ): Promise<void> {
    await this.authService.signUp(authRegisterDto);
  }

  @Post('/find')
  async findUsername(@Body(AuthFindPipe) values: string[]) {
    const [type, value] = values;
    if (type === 'email') {
      return this.authService.findUsernameByEmail(value);
    } else {
      return this.authService.requestChangePassword(value);
    }
  }

  @Post('/signin')
  async signIn(
    @Body(ValidationPipe) authCredentailDto: AuthCredentailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, historys } = await this.authService.validateUser(
      authCredentailDto,
    );

    const payload = { id: user.id, username: user.username };

    const accessToken = this.authService.getAccessToken(payload);
    const { refreshToken, cookieOption } =
      this.authService.getRefreshTokenWithCookie(payload);
    await this.authService.setCurrentRefreshToken(refreshToken, user);

    response.cookie('waverefresh', refreshToken, cookieOption);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedRefreshToken, password, ...userData } = user;

    return { accessToken, userData: { ...userData, historys } };
  }

  @Post('/signout')
  @UseGuards(JwTRefreshGuard)
  async siginOut(
    @GetUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieOption = this.authService.removeRefreshTokenWithCookie(user);
    response.cookie('waverefresh', '', cookieOption);
    return;
  }

  @Post('/refresh')
  @UseGuards(JwTRefreshGuard)
  refreshAccessToken(@GetUser() user: User) {
    const payload = { id: user.id, username: user.username };
    const accessToken = this.authService.getAccessToken(payload);
    return { accessToken };
  }

  @Get('/random')
  async getRandomUsers() {
    return this.authService.getRandomUsers();
  }

  @Get('/info')
  @UseGuards(JwtAuthGuard)
  async getUserData(
    @GetUser() user: User,
    @Query('updatedat') updatedAt?: string,
  ) {
    if (updatedAt) {
      const a = new Date(updatedAt).getTime();
      const b = new Date(user.updatedAt).getTime();
      if (a === b) {
        return;
      }
    }
    return this.authService.getUserData(user.id);
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    return this.authService.findUserById(id);
  }

  @Get('/search/:keyward')
  searchMusic(
    @Param('keyward') keyward: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.authService.searchUser(keyward, pagingDto);
  }

  @Patch('/email')
  @UseGuards(JwtAuthGuard)
  async changeEmail(@GetUser() user: User, @Body() emailDto: EmailDto) {
    return this.authService.changeEmail(user, emailDto.email);
  }

  @Patch('/newpassword')
  @UseGuards(JwtAuthGuard)
  async setNewPassword(
    @GetUser() user: User,
    @Body() body: { password: string },
  ) {
    if (!body?.password) {
      throw new BadRequestException(
        'You must request with body include password',
      );
    }
    user.hashedRefreshToken = null;
    return this.authService.setPassword(user, body.password);
  }

  @Patch('/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @GetUser() user: User,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, changePasswordDto);
  }

  @Patch('/profile')
  @UseGuards(JwtAuthGuard)
  async updateUserDesc(
    @GetUser() user: User,
    @Body(ValidationPipe) authProfileDto: AuthProfileDto,
  ) {
    return this.authService.updateProfileData(user, authProfileDto);
  }

  @Patch('/image/update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'data', maxCount: 1 },
    ]),
  )
  async updateProfileImage(
    @GetUser() user: User,
    @UploadedFiles(UpdateProfileImagePipe)
    updateProfileImageDto: UpdateProfileImageDto,
  ) {
    return this.authService.updateProfileImage(user, updateProfileImageDto);
  }

  @Patch('/follow/:targetId')
  @UseGuards(JwtAuthGuard)
  async followUser(@GetUser() user: User, @Param('targetId') targetId: string) {
    return this.authService.toggleFollow(user.id, targetId);
  }

  @Patch('/like/:target/:targetId')
  @UseGuards(JwtAuthGuard)
  async likeTarget(
    @GetUser() user: User,
    @Param('target', CheckTargetPipe) target: 'music' | 'playlist',
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.authService.toggleColumnTarget(
      user.id,
      { name: target, id: targetId },
      'like',
    );
  }

  @Patch('/repost/:target/:targetId')
  @UseGuards(JwtAuthGuard)
  async repostTarget(
    @GetUser() user: User,
    @Param('target', CheckTargetPipe) target: 'music' | 'playlist',
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.authService.toggleColumnTarget(
      user.id,
      { name: target, id: targetId },
      'repost',
    );
  }

  @Delete('')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@GetUser() user: User) {
    return this.authService.deleteAccount(user);
  }
}
