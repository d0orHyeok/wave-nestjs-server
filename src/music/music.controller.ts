import { UpdateCoverPipe } from './pipes/update-cover.pipe';
import { UpdateCoverDto } from './dto/update-cover.dto';
import { UpdateMusicDataDto } from './dto/update-music-data.dto';
import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import { User } from 'src/entities/user.entity';
import { MusicService } from './music.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { GetUser } from 'src/decorators/get-user.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadedFilesPipe } from './pipes/uploaded-files.pipe';
import { UploadMusicDto } from './dto/upload-music.dto';
import { ConfigService } from '@nestjs/config';
import { CheckDatePipe } from './pipes/check-date.pipe';
import { Music, musicGenres } from 'src/entities/music.entity';
import { JwtAuthUserGuard } from 'src/auth/guards/jwt-auth-user.guard';
import { CheckChartPipe } from './pipes/check-chart.pipe.ts';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('music')
@ApiTags('Music API')
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
export class MusicController {
  constructor(
    private musicService: MusicService,
    private config: ConfigService,
  ) {}
  private logger = new Logger('MusicController');

  @ApiOperation({
    summary: '전체음악 조회 API',
    description:
      '전체음악을 조회하건 query를 통해 인기 도는 최신음악 차트 음악들을 받아온다.',
  })
  @ApiQuery({ required: false, name: 'option' })
  @ApiResponse({
    status: 200,
    description:
      'Music[] 또는 { genre: "string", musics: Music[] }[]의 데이터를 반환받는다.',
  })
  @Get('/')
  async getAllMusic(@Query('option') option?: 'trend' | 'newrelease') {
    if (option) {
      const genres = [undefined, ...musicGenres];
      const musicsList = await Promise.all(
        genres.map((genre) =>
          this.musicService.findChartedMusics(option, genre),
        ),
      );

      const items = genres
        .map((genre, index) => {
          return {
            genre: genre || 'All music genres',
            musics: musicsList[index],
          };
        })
        .filter((item) => item.musics.length);
      return items;
    } else {
      return this.musicService.getAllMusic();
    }
  }

  @ApiOperation({
    summary: '랜덤음악 조회 API',
    description: '랜덤으로 10곡의 음악을 조회한다',
  })
  @ApiResponse({ status: 200, type: Music })
  @Get('/random')
  randomMusic() {
    return this.musicService.getRandomMusics();
  }

  @ApiOperation({
    summary: '음악 찾기 (IDs) API',
    description: `Query ids로 음악ID들을 받아와 해당하는 음악들을 조회한다.`,
  })
  @ApiQuery({
    required: true,
    name: 'ids',
    description: `','로 합쳐 문자화된 음악ID배열 데이터`,
  })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 음악은 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Music, isArray: true })
  @Get('/ids')
  getMusicsByIds(@Query('ids') ids: string, @Query('uid') uid?: string) {
    const musicIds = ids.split(',').map((v) => Number(v));
    return this.musicService.findMusicsByIds(musicIds, uid);
  }

  @ApiOperation({
    summary: '음악 찾기 (고유주소) API',
    description: `음악 고유주소로 찾아 조회한다.`,
  })
  @ApiResponse({ status: 200, type: Music, isArray: true })
  @Get('/permalink/:userId/:permalink')
  getMusicByPermalink(
    @Param('userId') userId: string,
    @Param('permalink') permalink: string,
  ) {
    return this.musicService.findMusicByPermalink(userId, permalink);
  }

  @ApiOperation({
    summary: '연관음악 찾기 API',
    description: `파라미터의 음악ID와 연관된 음악을 찾아 조회한다.`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiResponse({ status: 200, type: Music, isArray: true })
  @Get('/related/:id')
  findRelatedMusic(
    @Param('id', ParseIntPipe) id: number,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.musicService.findRelatedMusic(id, pagingDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: '연관음악 찾기 (유저) API',
    description: `유저의 좋아요한 음악, 재생기록을 토대로 연관음악을 찾아 조회한다.`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiResponse({ status: 200, type: Music, isArray: true })
  @Get('/related')
  @UseGuards(JwtAuthUserGuard)
  findUsersRelatedMusics(@GetUser() user: User) {
    return this.musicService.findUsersRelated(user);
  }

  @ApiOperation({
    summary: '인기음악 조회 API',
    description: `파라미터로 userId에 해당하는 유저의 음악들 중 재생횟수 10이상의 음악들을 조회한다.`,
  })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 음악은 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Music, isArray: true })
  @Get('/popular/:userId')
  getPopularMusics(
    @Param('userId') userId: string,
    @Query('uid') uid?: string,
  ) {
    return this.musicService.findPopularMusicsByUserId(userId, uid);
  }

  @ApiOperation({
    summary: '유저음악 조회 API',
    description: `파라미터로 userId에 해당하는 유저의 음악을 조회한다.`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 음악은 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Music, isArray: true })
  @Get('/user/:userId')
  getUserMusics(
    @Param('userId') userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('uid') uid?: string,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.musicService.findMusicsByUserId(userId, pagingDto, uid);
  }

  @ApiOperation({
    summary: '음악 검색 API',
    description: `파라미터 keyward와 연관있는 음악들을 조회한다.`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 음악은 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Music, isArray: true })
  @Get('/search/:keyward')
  searchMusic(
    @Param('keyward') keyward: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('uid') uid?: string,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.musicService.searchMusic(keyward, pagingDto, uid);
  }

  @ApiOperation({
    summary: '음악 태그 검색 API',
    description: `파라미터 tag의 음악들을 조회한다.`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 음악은 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Music, isArray: true })
  @Get('/tag/:tag')
  getTaggedMusics(
    @Param('tag') tag: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('uid') uid?: string,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.musicService.findMusicsByTag(tag, pagingDto, uid);
  }

  @ApiOperation({
    summary: '음악 차트 조회 API',
    description: `인기 또는 신규 음악 차트를 조회한다.`,
  })
  @ApiQuery({
    required: true,
    name: 'chart',
    description: `value must be in 'trend' or 'newrelease'`,
  })
  @ApiQuery({ required: false, name: 'genre' })
  @ApiQuery({
    required: false,
    name: 'date',
    description: `date must be in number or 'week' or 'month'`,
  })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 음악은 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Music[] 또는 { genre: "string", musics: Music[] }[]의 데이터를 반환받는다.',
  })
  @Get('/chart')
  async getChartedMusics(
    @Query('chart', CheckChartPipe) chart?: 'trend' | 'newrelease',
    @Query('genre') genre?: string | string[],
    @Query('date', CheckDatePipe) date?: number | 'week' | 'month',
  ) {
    return this.musicService.findChartedMusics(chart, genre, date);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '음악 업로드 API' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        musics: { type: 'string', format: 'binary' },
        covers: { type: 'string', format: 'binary' },
        datas: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      '음악을 입력받은 커버와 데이터에 맞게 수정하고 Firebase에 업로드',
    type: Music,
  })
  @Post('/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'musics', maxCount: 1 },
      { name: 'covers', maxCount: 1 },
      { name: 'datas', maxCount: 1 },
    ]),
  )
  async uploadMusic(
    @UploadedFiles(UploadedFilesPipe) uploadMusicDto: UploadMusicDto,
    @GetUser() user: User,
  ) {
    return this.musicService.uploadMusic(uploadMusicDto, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '음악 삭제 API' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  deleteMusic(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.musicService.deleteMusic(id, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '음악 정보 수정 API' })
  @ApiResponse({ status: 200, type: Music })
  @Patch('/:id/update')
  @UseGuards(JwtAuthGuard)
  updateMusicData(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateMusicDataDto: UpdateMusicDataDto,
  ) {
    return this.musicService.updateMusicData(id, updateMusicDataDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '음악 정보 수정 (이미지 포함) API' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cover: { type: 'string', format: 'binary' },
        data: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, type: Music })
  @Patch('/:id/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cover', maxCount: 1 },
      { name: 'data', maxCount: 1 },
    ]),
  )
  changeCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(UpdateCoverPipe) updateCoverDto: UpdateCoverDto,
  ) {
    return this.musicService.changeMusicCover(id, updateCoverDto);
  }
}
