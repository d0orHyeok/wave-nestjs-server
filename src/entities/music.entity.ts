import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Comment } from 'src/entities/comment.entity';
import { Playlist } from 'src/entities/playlist.entity';
import { User } from 'src/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityStatus } from './common.types';
import { History } from './history.entity';

export const musicGenres = [
  'Hip-hop & Rap',
  'Pop',
  'R&B & Soul',
  'Electronic',
  'House',
  'Soundtrack',
  'Dance & EDM',
  'Jazz & Blues',
  'Folk & Singer-Songwriter',
  'Rock',
  'Indie',
  'Classical',
  'Piano',
  'Ambient',
  'Techno',
  'Trap',
  'Dubstep',
  'Country',
  'Metal',
  'Trance',
  'Latin',
  'Drum & Base',
  'Reggae',
  'Disco',
  'World',
];

@Entity()
export class Music extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  // Music Info
  @ApiProperty()
  @Column()
  title: string;
  @ApiProperty({ description: '고유주소' })
  @Column()
  permalink: string;
  @ApiProperty({ required: false, description: 'Firebase에 저장된 파일명' })
  @Column()
  filename: string;
  @ApiProperty({ description: '음악파일 경로' })
  @Column()
  link: string;
  @ApiProperty({ description: '오디오파일 길이(초)' })
  @Column('float')
  duration: number;

  // Optional Info
  @ApiProperty({ description: '음악파일 커버 이미지 경로' })
  @Column({ nullable: true })
  cover: string;
  @ApiProperty({ required: false, description: 'Firebase에 저장된 파일명' })
  @Column({ nullable: true })
  coverFilename: string;
  @ApiProperty()
  @Column({ nullable: true })
  description: string;
  @ApiProperty({ type: String, isArray: true })
  @Column('text', { nullable: true, array: true })
  genre: string[];
  @ApiProperty({ type: String, isArray: true })
  @Column('text', { nullable: true, array: true })
  tags: string[];
  @ApiHideProperty()
  @Column('text', { nullable: true, array: true, select: false })
  genreLower: string[];
  @ApiHideProperty()
  @Column('text', { nullable: true, array: true, select: false })
  tagsLower: string[];
  @ApiProperty({ description: '오디오파형 분석 데이터' })
  @Column({ nullable: true })
  waveform: string;

  // Optional Metadata
  @ApiProperty()
  @Column({ nullable: true })
  album: string;
  @ApiProperty()
  @Column({ nullable: true })
  artist: string;
  @ApiProperty()
  @Column({ nullable: true })
  albumartist: string;
  @ApiProperty()
  @Column({ nullable: true })
  year: number;
  @ApiProperty({ type: String, isArray: true })
  @Column('text', { nullable: true, array: true })
  composer: string[];
  @ApiProperty({ type: String, isArray: true })
  @Column('text', { nullable: true, array: true })
  lyrics: string[];

  // Privacy
  @ApiProperty({ enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' })
  @Column({ default: EntityStatus.PUBLIC })
  status: EntityStatus;

  // Create User
  @ApiProperty({ required: false, description: '생성한 유저ID' })
  @Column({ nullable: true, name: 'userId' })
  userId: string;
  @ManyToOne(() => User, (user) => user.musics, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @ApiProperty({ required: false, type: User })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  // History
  @ApiProperty({
    required: false,
    type: History,
    isArray: true,
    description: '재생기록',
  })
  @OneToMany(() => History, (history) => history.music)
  history: History[];

  @ApiProperty({ required: false, type: User, isArray: true })
  @ManyToMany(() => User, (user) => user.repostMusics, { onDelete: 'CASCADE' })
  reposts: User[];
  @ApiProperty({ required: false, type: User, isArray: true })
  @ManyToMany(() => User, (user) => user.likeMusics, { onDelete: 'CASCADE' })
  likes: User[];
  @ApiProperty({
    required: false,
    type: Playlist,
    isArray: true,
    description: '속한 플레이리스트 목록',
  })
  @ManyToMany(() => Playlist, (playlist) => playlist.musics, {
    onDelete: 'CASCADE',
  })
  playlists: Playlist[];
  @ApiProperty({ required: false, type: Comment, isArray: true })
  @OneToMany(() => Comment, (comment) => comment.music, { onDelete: 'CASCADE' })
  comments: Comment[];

  // Date
  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
