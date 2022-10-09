import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiBadRequestResponse({
  status: 400,
  description: '잘못된 파라미터',
})
@ApiInternalServerErrorResponse({
  status: 500,
  description: '서버 로직 문제',
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiOperation({
    summary: '전체 검색',
    description:
      'Parameter "keyward" 와 연관된 유저, 음악, 플레이리스트 들을 조회한다.',
  })
  @ApiQuery({ required: false, name: 'skip' })
  @ApiQuery({ required: false, name: 'take' })
  @ApiQuery({
    required: false,
    name: 'uid',
    description:
      '유저ID, 해당하는 아이디의 음악은 공개여부에 상관없이 조회한다.',
  })
  @ApiResponse({
    status: 200,
    description: '유저, 음악, 플레이리스트가 포함된 배열을 반환',
  })
  @Get('/search/:keyward')
  async searchAll(
    @Param('keyward') keyward: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('uid') uid?: string,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.appService.searchAll(keyward, pagingDto, uid);
  }
}
