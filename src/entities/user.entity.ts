import { Playlist } from './playlist.entity';
import { Comment } from './comment.entity';
import { Music } from 'src/entities/music.entity';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import ShortUniqueId from 'short-unique-id';
import { History } from './history.entity';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

@Entity()
@Unique(['username'])
export class User extends BaseEntity {
  @ApiProperty()
  @PrimaryColumn()
  id: string;

  // Sign In Data
  @ApiProperty({ description: '아이디' })
  @Column()
  username: string;
  @ApiHideProperty()
  @Column({ select: false })
  password: string;
  @ApiHideProperty()
  @Column({ nullable: true, select: false })
  hashedRefreshToken: string;

  // User Info
  @ApiProperty()
  @Column()
  email: string;
  @ApiProperty()
  @Column({ nullable: true })
  nickname: string;
  @ApiProperty({ description: '프로필 이미지 경로' })
  @Column({ nullable: true })
  profileImage: string;
  @ApiProperty({ required: false, description: 'Firebase에 저장된 파일명' })
  @Column({ nullable: true })
  profileImageFilename: string;
  @ApiProperty({ description: '자기소개' })
  @Column({ nullable: true })
  description: string;

  // User Likes & Reposts
  @ApiProperty({ required: false, type: Music, isArray: true })
  @ManyToMany(() => Music, (music) => music.likes, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  likeMusics: Music[];
  @ApiProperty({ required: false, type: Music, isArray: true })
  @ManyToMany(() => Music, (music) => music.reposts, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  repostMusics: Music[];
  @ApiProperty({ required: false, type: Playlist, isArray: true })
  @ManyToMany(() => Playlist, (playlist) => playlist.likes, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  likePlaylists: Playlist[];
  @ApiProperty({ required: false, type: Playlist, isArray: true })
  @ManyToMany(() => Playlist, (playlist) => playlist.reposts, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  repostPlaylists: Playlist[];

  // Follow
  @ApiProperty({ required: false, type: User, isArray: true })
  @ManyToMany(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  followers: User[];
  @ApiProperty({ required: false, type: User, isArray: true })
  @ManyToMany(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  @JoinTable()
  following: User[];

  // User Relation column
  @ApiProperty({ type: Music, isArray: true, description: '업로드한 음악' })
  @OneToMany(() => Music, (music) => music.user, {
    eager: true,
    onDelete: 'CASCADE',
  })
  musics: Music[];
  @ApiProperty({
    type: Playlist,
    isArray: true,
    description: '만든 플레이리스트',
  })
  @OneToMany(() => Playlist, (playlist) => playlist.user, {
    eager: true,
    onDelete: 'CASCADE',
  })
  playlists: Playlist[];
  @ApiProperty({
    required: false,
    type: Comment,
    isArray: true,
    description: '댓글',
  })
  @OneToMany(() => Comment, (comment) => comment.user, { onDelete: 'CASCADE' })
  comments: Comment[];

  // History
  @ApiProperty({
    required: false,
    type: History,
    isArray: true,
    description: '재생기록',
  })
  @OneToMany(() => History, (history) => history.user)
  historys: History[];

  // Date
  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  // Update Function
  @BeforeInsert()
  generateId() {
    const uid = new ShortUniqueId({ length: 12 });
    this.id = uid();
  }
}
