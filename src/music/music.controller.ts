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
import { extname } from 'path';
import { UploadedFilesPipe } from './pipes/uploaded-files.pipe';
import { UploadMusicDto } from './dto/upload-music.dto';
import { uploadFileDisk } from 'src/fileFunction';
import { ConfigService } from '@nestjs/config';
import { CheckDatePipe } from './pipes/check-date.pipe';
import { musicGenres } from 'src/entities/music.entity';

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
    const { music, cover, data } = uploadMusicDto;

    const fileBase = `${Date.now()}_${user.id}_`;

    const { buffer, originalname, mimetype } =
      this.musicService.changeMusicFileData(music, data, cover);

    let coverUrl: string | undefined;
    if (cover) {
      coverUrl =
        this.config.get<string>('SERVER_URL') +
        '/' +
        uploadFileDisk(
          cover,
          `${fileBase}cover${extname(cover.originalname)}`,
          'cover',
        );
    }

    const { filename, link } = await this.musicService.uploadFileFirebase(
      buffer,
      mimetype,
      fileBase + originalname,
    );

    const waveform = await this.musicService.generateWaveformData(music);

    const createMusicData = {
      ...data,
      filename,
      link,
      cover: coverUrl,
      waveform,
    };

    return this.musicService.createMusic(createMusicData, user);
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
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.musicService.changeMusicCover(id, file);
  }
}
