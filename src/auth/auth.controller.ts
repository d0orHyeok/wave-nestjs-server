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
import {
  ApiOperation,
  ApiBody,
  ApiTags,
  ApiResponse,
  ApiQuery,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  getSchemaPath,
  ApiConsumes,
} from '@nestjs/swagger';
import { Music } from 'src/entities/music.entity';
import { Playlist } from 'src/entities/playlist.entity';

@Controller('auth')
@ApiTags('Auth API')
@ApiBadRequestResponse({
  status: 400,
  description: '잘못된 파라미터',
})
@ApiUnauthorizedResponse({
  status: 401,
  description: '비인증',
})
@ApiInternalServerErrorResponse({
  status: 500,
  description: '서버 로직 문제',
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: '회원가입 API' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 409, description: '이미존재하는 아이디' })
  @UsePipes(AuthRegisterPipe)
  async signUp(
    @Body(ValidationPipe) authRegisterDto: AuthRegisterDto,
  ): Promise<void> {
    await this.authService.signUp(authRegisterDto);
  }

  @ApiOperation({
    summary: '찾기 API',
    description: '아이디 또는 비밀번호 찾기',
  })
  @ApiResponse({
    status: 200,
    description: '찾은 아이디들의 배열을 반환한다.',
    type: [String],
  })
  @ApiResponse({
    status: 201,
    description:
      '요청 성공여부와 성공 시 요청을 보낸 이메일주소가 포함된 객체를 반환한다.',
    schema: {
      properties: {
        success: { type: 'boolean' },
        email: { type: 'string' },
      },
    },
  })
  @Post('/find')
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        username: { type: 'string' },
      },
    },
    description:
      '아이디를 찾기원하면 이메일을, 비밀번호를 찾기원하면 아이디를 보낸다',
  })
  async findUsername(@Body(AuthFindPipe) values: string[]) {
    const [type, value] = values;
    if (type === 'email') {
      return this.authService.findUsernameByEmail(value);
    } else {
      return this.authService.requestChangePassword(value);
    }
  }

  @ApiOperation({
    summary: '로그인 API',
    description:
      '로그인 후 accessToken과 유저정보를 반환하고 refreshToken을 쿠키로 전송한다',
  })
  @ApiResponse({
    status: 201,
    description: '로그인 성공',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        userData: { $ref: getSchemaPath(User) },
      },
    },
  })
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

  @ApiCookieAuth()
  @ApiOperation({
    summary: '로그아웃 API',
    description: '로그아웃 성공시 refreshToken 쿠키를 만료시킨다.',
  })
  @ApiResponse({ status: 201, description: '로그아웃 성공' })
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

  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Access Token 재발급 API',
    description: 'Refresh Token을 확인하고 Access Token을 재발급한다.',
  })
  @ApiResponse({
    status: 201,
    description: '재발급 성공',
    schema: {
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @Post('/refresh')
  @UseGuards(JwTRefreshGuard)
  refreshAccessToken(@GetUser() user: User) {
    const payload = { id: user.id, username: user.username };
    const accessToken = this.authService.getAccessToken(payload);
    return { accessToken };
  }

  @ApiOperation({
    summary: '랜덤유저 조회 API',
    description: '임의로 선정된 4명의 유저정보를 조회한다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: [User] })
  @Get('/random')
  async getRandomUsers() {
    return this.authService.getRandomUsers();
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '사용자 정보조회 API',
    description: '로그인한 사용자의 정보를 조회한다.',
  })
  @ApiQuery({ name: 'updatedat', required: false })
  @ApiResponse({ status: 200, description: '조회 성공', type: User })
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

  @ApiOperation({
    summary: '유저 정보조회 API',
    description: 'Parameter로 입력받은 id에 해당하는 유저의 정보를 조회한다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: User })
  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    return this.authService.findUserById(id);
  }

  @ApiOperation({
    summary: '유저 검색 API',
    description: 'Parameter로 입력받은 키워드와 연관된 유저들을 조회한다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: [User] })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @Get('/search/:keyward')
  searchMusic(
    @Param('keyward') keyward: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.authService.searchUser(keyward, pagingDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '유저 이메일 변경 API' })
  @ApiResponse({
    status: 200,
    description: '변경된 이메일 주소를 받아온다.',
    type: String,
  })
  @Patch('/email')
  @UseGuards(JwtAuthGuard)
  async changeEmail(@GetUser() user: User, @Body() emailDto: EmailDto) {
    return this.authService.changeEmail(user, emailDto.email);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '비밀번호 재설정 API' })
  @ApiResponse({ status: 200, description: '비밀번호 재설정 성공' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: '비밀번호 변경 API' })
  @ApiResponse({
    status: 200,
    description: '성공여부와 메세지를 반환한다.',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @Patch('/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @GetUser() user: User,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, changePasswordDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '프로필 정보 변경 API',
    description: '닉네임 또는 자기소개를 변경한다',
  })
  @ApiResponse({
    status: 200,
    description: '바뀐 정보를 반환받는다.',
    schema: {
      properties: {
        nickname: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @Patch('/profile')
  @UseGuards(JwtAuthGuard)
  async updateUserDesc(
    @GetUser() user: User,
    @Body(ValidationPipe) authProfileDto: AuthProfileDto,
  ) {
    return this.authService.updateProfileData(user, authProfileDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '프로필 정보 변경 API',
    description: 'FormData로 받은 이미지, 데이터로 프로필 정보를 변경한다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        data: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '업데이트된 유저정보를 반환받는다',
    type: User,
  })
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

  @ApiBearerAuth()
  @ApiOperation({
    summary: '팔로우 API',
    description: '팔로우 언팔로우 기능을 수행한다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '팔로우했는지 여부와 바뀐 팔로잉 배열이 포함된 객체를 반환받는다.',
    schema: {
      properties: {
        type: { type: 'string', example: 'unfollow' },
        following: { $ref: getSchemaPath(User) },
      },
    },
  })
  @Patch('/follow/:targetId')
  @UseGuards(JwtAuthGuard)
  async followUser(@GetUser() user: User, @Param('targetId') targetId: string) {
    return this.authService.toggleFollow(user.id, targetId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 API' })
  @ApiResponse({
    status: 200,
    description:
      '음악 또는 플레이리스트의 좋아요를 추가 제거했는지 여부와 변화된 배열이 포함된 객체를 반환받는다.',
    schema: {
      properties: {
        toggleType: { type: 'string', example: 'unlike' },
        columnName: { $ref: getSchemaPath(Music) },
      },
    },
  })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: '리포스트 API' })
  @ApiResponse({
    status: 200,
    description:
      '음악 또는 플레이리스트의 리포스트를 추가 제거했는지 여부와 변화된 배열이 포함된 객체를 반환받는다.',
    schema: {
      properties: {
        toggleType: { type: 'string', example: 'repost' },
        columnName: { $ref: getSchemaPath(Playlist) },
      },
    },
  })
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

  @ApiCookieAuth()
  @ApiOperation({ summary: '계정삭제 API' })
  @ApiResponse({ status: 200, description: '계정 삭제 성공' })
  @Delete('')
  @UseGuards(JwTRefreshGuard)
  async deleteAccount(@GetUser() user: User) {
    return this.authService.deleteAccount(user);
  }
}
