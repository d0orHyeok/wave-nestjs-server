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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import { User } from 'src/entities/user.entity';
import { CreateHistoryDto } from './dto/create-history.dto';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

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

  @Post('/create')
  async createHistory(
    @Body(ValidationPipe) createHistoryDto: CreateHistoryDto,
  ) {
    return this.historyService.createHistory(createHistoryDto);
  }

  @Patch('/clear')
  @UseGuards(JwtAuthGuard)
  async clearHistory(@GetUser() user: User) {
    return this.historyService.clearHistory(user);
  }
}
