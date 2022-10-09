import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import { History } from 'src/entities/history.entity';
import { User } from 'src/entities/user.entity';
import { CreateHistoryDto } from './dto/create-history.dto';
import { HistoryService } from './history.service';

@Controller('history')
@ApiTags('History API')
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
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: '재생기록 조회 API' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiResponse({
    status: 200,
    description: '재생기록을 받는다',
    type: History,
    isArray: true,
  })
  @Get('/user')
  @UseGuards(JwtAuthGuard)
  async findHistorysByUserId(
    @GetUser() user: User,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const pagingDto = { take: take || 10, skip: skip || 0 };
    return this.historyService.findHistorysByUserId(user.id, pagingDto);
  }

  @ApiOperation({ summary: '재생기록 생성 API' })
  @ApiResponse({ status: 201, description: '재생기록을 만든다', type: History })
  @Post('/create')
  async createHistory(
    @Body(ValidationPipe) createHistoryDto: CreateHistoryDto,
  ) {
    return this.historyService.createHistory(createHistoryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '재생기록 초기화 API' })
  @ApiResponse({
    status: 200,
    description: '유저의 모든 재생기록의 column "clear"를 true로 설정한다.',
  })
  @Patch('/clear')
  @UseGuards(JwtAuthGuard)
  async clearHistory(@GetUser() user: User) {
    return this.historyService.clearHistory(user);
  }
}
