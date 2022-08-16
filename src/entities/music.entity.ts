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
  @PrimaryGeneratedColumn()
  id: number;

  // Music Info
  @Column()
  title: string;
  @Column()
  permalink: string;
  @Column()
  filename: string;
  @Column()
  link: string;
  @Column('float')
  duration: number;

  // Optional Info
  @Column({ nullable: true })
  cover: string;
  @Column({ nullable: true })
  description: string;
  @Column('text', { nullable: true, array: true })
  genre: string[];
  @Column('text', { nullable: true, array: true })
  tags: string[];
  @Column('text', { nullable: true, array: true, select: false })
  genreLower: string[];
  @Column('text', { nullable: true, array: true, select: false })
  tagsLower: string[];
  @Column({ nullable: true })
  waveform: string;

  // Optional Metadata
  @Column({ nullable: true })
  album: string;
  @Column({ nullable: true })
  artist: string;
  @Column({ nullable: true })
  albumartist: string;
  @Column({ nullable: true })
  year: number;
  @Column('text', { nullable: true, array: true })
  composer: string[];
  @Column('text', { nullable: true, array: true })
  lyrics: string[];

  // Privacy
  @Column({ default: EntityStatus.PUBLIC })
  status: EntityStatus;

  // Create User
  @Column({ nullable: true, name: 'userId' })
  userId: string;
  @ManyToOne(() => User, (user) => user.musics, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  // History
  @OneToMany(() => History, (history) => history.music)
  history: History[];

  @ManyToMany(() => User, (user) => user.repostMusics)
  reposts: User[];
  @ManyToMany(() => User, (user) => user.likeMusics)
  likes: User[];
  @ManyToMany(() => Playlist, (playlist) => playlist.musics)
  playlists: Playlist[];
  @OneToMany(() => Comment, (comment) => comment.music)
  comments: Comment[];

  // Date
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
