import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { MusicRepository } from 'src/music/music.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MusicRepository]), AuthModule],
  controllers: [MusicController],
  providers: [MusicService],
})
export class MusicModule {}
