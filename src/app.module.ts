import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MusicModule } from './music/music.module';
import { ConfigurationModule } from './configs/configuration.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PlaylistModule } from './playlist/playlist.module';
import { CommentModule } from './comment/comment.module';
import { HistoryModule } from './history/history.module';
import { MusicRepository } from './music/music.repository';
import { UserRepository } from './auth/user.repository';
import { PlaylistRepository } from './playlist/playlist.repository';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    // .env variables
    ConfigurationModule,
    // DB Connection
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([
      PlaylistRepository,
      UserRepository,
      MusicRepository,
    ]),
    // Serve Static file
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..'),
    }),
    MusicModule,
    AuthModule,
    PlaylistModule,
    CommentModule,
    HistoryModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
