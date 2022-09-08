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
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { GetUser } from 'src/decorators/get-user.decorator';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { UploadedFilesPipe } from './pipes/uploaded-files.pipe';
import { UploadMusicDto } from './dto/upload-music.dto';
import { ConfigService } from '@nestjs/config';
import { CheckDatePipe } from './pipes/check-date.pipe';
import { musicGenres } from 'src/entities/music.entity';
import { MulterFile } from 'src/entities/common.types';

@Controller('music')
export class MusicController {
  constructor(
    private musicService: MusicService,
    private config: ConfigService,
  ) {}
  private logger = new Logger('MusicController');

  @Get('/')
  async getAllMusic(@Query('option') option?: string) {
    if (option) {
      const genres = [undefined, ...musicGenres];
      const musicsList = await Promise.all(
        genres.map((genre) => {
          return option === 'newrelease'
            ? this.musicService.findNewReleaseMusics(genre)
            : this.musicService.findTrendingMusics(genre);
        }),
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
  @UseGuards(JwtAuthGuard)
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

  @Get('/trend')
  getTrendingMusics(
    @Query('genre') genre?: string,
    @Query('date', CheckDatePipe) date?: number | 'week' | 'month',
  ) {
    return this.musicService.findTrendingMusics(genre, date);
  }

  @Get('/newrelease')
  getNewReleaseMusics(
    @Query('genre') genre?: string,
    @Query('date', CheckDatePipe) date?: number | 'week' | 'month',
  ) {
    return this.musicService.findNewReleaseMusics(genre, date);
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
  @UseInterceptors(FileInterceptor('file'))
  changeCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: MulterFile,
  ) {
    return this.musicService.changeMusicCover(id, file);
  }
}
