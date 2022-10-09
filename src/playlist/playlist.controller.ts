import { UpdateImageDto } from './dto/update-image.dto';
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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import { User } from 'src/entities/user.entity';
import { CreatePlaylistDto } from './dto/createPlaylistDto';
import { PlaylistService } from './playlist.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateImagePipe } from './pipes/update-image.pipe';
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
import { Playlist } from 'src/entities/playlist.entity';

@Controller('playlist')
@ApiTags('Playlist API')
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
export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  @ApiOperation({
    summary: '플레이리스트 찾기 (IDs) API',
    description: `Query ids로 플레이리스트ID들을 받아와 해당하는 플레이리스트들을 조회한다.`,
  })
  @ApiQuery({
    required: true,
    name: 'ids',
    description: `','로 합쳐 문자화된 플레이리스트ID 배열 데이터`,
  })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 플레이리스트는 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Playlist, isArray: true })
  @Get('/ids')
  getPlaylistsByIds(@Query('ids') ids: string, @Query('uid') uid?: string) {
    const playlistIds = ids.split(',').map((v) => Number(v));
    return this.playlistService.findPlaylistsByIds(playlistIds, uid);
  }

  @ApiOperation({
    summary: '플레이리스트 찾기 (고유주소) API',
    description: `플레이리스트 고유주소로 찾아 조회한다.`,
  })
  @ApiResponse({ status: 200, type: Playlist, isArray: true })
  @Get('permalink/:userId/:permalink')
  async getPlaylist(
    @Param('userId') userId: string,
    @Param('permalink') permalink: string,
  ) {
    return this.playlistService.findPlaylistByPermalink(userId, permalink);
  }

  @ApiOperation({
    summary: '플레이리스트 찾기 (음악 포함)',
    description: `Parameter "id"에 해당하는 음악이 있는 플레이리스트들을 찾는다`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 플레이리스트는 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Playlist, isArray: true })
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

  @ApiOperation({
    summary: '유저플레이리스트 조회 API',
    description: `파라미터로 userId에 해당하는 유저의 플레이리스트들을 조회한다.`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 플레이리스트는 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Playlist, isArray: true })
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

  @ApiOperation({
    summary: '플레이리스트 검색 API',
    description: `파라미터 keyward와 연관있는 플레이리스트들을 조회한다.`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 플레이리스트는 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Playlist, isArray: true })
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

  @ApiOperation({
    summary: '플레이리스트 태그 검색 API',
    description: `파라미터 tag의 플레이리스트들을 조회한다.`,
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 플레이리스트는 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({ status: 200, type: Playlist, isArray: true })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이리스트 생성 API' })
  @ApiResponse({ status: 201, type: Playlist })
  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async createPlaylist(
    @GetUser() user: User,
    @Body(ValidationPipe) createPlaylistDto: CreatePlaylistDto,
  ) {
    return this.playlistService.createPlaylist(user, createPlaylistDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이리스트 수정 API' })
  @ApiResponse({ status: 201, type: Playlist })
  @Patch('/update/:id')
  @UseGuards(JwtAuthGuard)
  async updatePlaylistInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatePlaylistDto: UpdatePlaylistDto,
  ) {
    return this.playlistService.updatePlaylistInfo(id, updatePlaylistDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이리스트 정보 수정 (이미지 포함) API' })
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
  @ApiResponse({ status: 200, type: Playlist })
  @Patch('/image/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'data', maxCount: 1 },
    ]),
  )
  changeCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(UpdateImagePipe) updateImageDto: UpdateImageDto,
  ) {
    return this.playlistService.changePlaylistImage(id, updateImageDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이리스트 음악추가 API' })
  @ApiResponse({ status: 200, type: Playlist })
  @Patch('/musics/add/:id')
  @UseGuards(JwtAuthGuard)
  async addMusicToPlaylist(
    @Param('id', ParseIntPipe) id: number,
    @Body('musicIds') musicIds: number[],
  ) {
    return this.playlistService.editPlaylistMusics(id, musicIds || [], 'add');
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이리스트 음악제거 API' })
  @ApiResponse({ status: 200, type: Playlist })
  @Patch('/musics/delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteMusicToPlaylist(
    @Param('id', ParseIntPipe) id: number,
    @Body('musicIds') musicIds: number[],
  ) {
    return this.playlistService.editPlaylistMusics(
      id,
      musicIds || [],
      'delete',
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '플레이리스트 삭제 API' })
  @ApiResponse({ status: 200, description: '플레이리스트 삭제' })
  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deletePlaylist(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.playlistService.deletePlaylist(id, user);
  }
}
