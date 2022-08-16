import { UpdatePlaylistDto } from './dto/updatePlaylistDto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import { User } from 'src/entities/user.entity';
import { CreatePlaylistDto } from './dto/createPlaylistDto';
import { PlaylistService } from './playlist.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from 'src/entities/common.types';

@Controller('playlist')
export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  @Get('/ids')
  getPlaylistsByIds(@Query('ids') ids: string, @Query('uid') uid?: string) {
    const playlistIds = ids.split(',').map((v) => Number(v));
    return this.playlistService.findPlaylistsByIds(playlistIds, uid);
  }

  @Get('permalink/:userId/:permalink')
  async getPlaylist(
    @Param('userId') userId: string,
    @Param('permalink') permalink: string,
  ) {
    return this.playlistService.findPlaylistByPermalink(userId, permalink);
  }

  @Get('/playlists/detail/:id')
  async findDetailPlaylistsById(
    @Param('id') id: number,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('uid') uid?: string,
  ) {
    const pagingDto = { take: take || 15, skip: skip || 0 };
    return this.playlistService.findDetailPlaylistsById(id, pagingDto, uid);
  }

  @Get('/user/:userId')
  async getUserPlaylists(
    @Param('userId') userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('uid') uid?: string,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.playlistService.findPlaylistsByUserId(userId, pagingDto, uid);
  }

  @Get('/search/:keyward')
  async searchPlaylist(
    @Param('keyward') keyward: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('uid') uid?: string,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.playlistService.searchPlaylist(keyward, pagingDto, uid);
  }

  @Get('/tag/:tag')
  async getTaggedPlaylists(
    @Param('tag') tag: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('uid') uid?: string,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.playlistService.findPlaylistsByTag(tag, pagingDto, uid);
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async createPlaylist(
    @GetUser() user: User,
    @Body(ValidationPipe) createPlaylistDto: CreatePlaylistDto,
  ) {
    return this.playlistService.createPlaylist(user, createPlaylistDto);
  }

  @Patch('/update/:id')
  @UseGuards(JwtAuthGuard)
  async updatePlaylistInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatePlaylistDto: UpdatePlaylistDto,
  ) {
    return this.playlistService.updatePlaylistInfo(id, updatePlaylistDto);
  }

  @Patch('/musics/add/:id')
  @UseGuards(JwtAuthGuard)
  async addMusicToPlaylist(
    @Param('id', ParseIntPipe) id: number,
    @Body('musicIds') musicIds: number[],
  ) {
    return this.playlistService.addMusicToPlaylist(id, musicIds || []);
  }

  @Patch('/musics/change/:id')
  @UseGuards(JwtAuthGuard)
  async changePlaylistMusics(
    @Param('id', ParseIntPipe) id: number,
    @Body('musicIds') musicIds: number[],
  ) {
    return this.playlistService.changePlaylistMusics(id, musicIds);
  }

  @Patch('/image/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  changeCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: MulterFile,
  ) {
    return this.playlistService.changePlaylistImage(id, file);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deletePlaylist(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.playlistService.deletePlaylist(id, user);
  }
}
