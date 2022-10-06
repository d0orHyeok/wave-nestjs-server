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
import { musicGenres } from 'src/entities/music.entity';
import { JwtAuthUserGuard } from 'src/auth/guards/jwt-auth-user.guard';
import { CheckChartPipe } from './pipes/check-chart.pipe.ts';

@Controller('music')
export class MusicController {
  constructor(
    private musicService: MusicService,
    private config: ConfigService,
  ) {}
  private logger = new Logger('MusicController');

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

  @Get('/random')
  randomMusic() {
    return this.musicService.getRandomMusics();
  }

  @Get('/ids')
  getMusicsByIds(@Query('ids') ids: string, @Query('uid') uid?: string) {
    const musicIds = ids.split(',').map((v) => Number(v));
    return this.musicService.findMusicsByIds(musicIds, uid);
  }

  @Get('/permalink/:userId/:permalink')
  getMusicByPermalink(
    @Param('userId') userId: string,
    @Param('permalink') permalink: string,
  ) {
    return this.musicService.findMusicByPermalink(userId, permalink);
  }

  @Get('/related/:id')
  findRelatedMusic(
    @Param('id', ParseIntPipe) id: number,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.musicService.findRelatedMusic(id, pagingDto);
  }

  @Get('/related')
  @UseGuards(JwtAuthUserGuard)
  findUsersRelatedMusics(@GetUser() user: User) {
    return this.musicService.findUsersRelated(user);
  }

  @Get('/popular/:userId')
  getPopularMusics(
    @Param('userId') userId: string,
    @Query('uid') uid?: string,
  ) {
    return this.musicService.findPopularMusicsByUserId(userId, uid);
  }

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

  @Get('/chart')
  async getChartedMusics(
    @Query('chart', CheckChartPipe) chart?: 'trend' | 'newrelease',
    @Query('genre') genre?: string | string[],
    @Query('date', CheckDatePipe) date?: number | 'week' | 'month',
  ) {
    return this.musicService.findChartedMusics(chart, genre, date);
  }

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

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  deleteMusic(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.musicService.deleteMusic(id, user);
  }

  @Patch('/:id/update')
  @UseGuards(JwtAuthGuard)
  updateMusicData(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateMusicDataDto: UpdateMusicDataDto,
  ) {
    return this.musicService.updateMusicData(id, updateMusicDataDto);
  }

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
