import { HistoryRepository } from './history.repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { MusicRepository } from 'src/music/music.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryRepository, MusicRepository]),
    AuthModule,
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
