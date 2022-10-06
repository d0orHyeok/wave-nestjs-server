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

@Entity()
@Unique(['username'])
export class User extends BaseEntity {
  @PrimaryColumn()
  id: string;

  // Sign In Data
  @Column()
  username: string;
  @Column({ select: false })
  password: string;
  @Column({ nullable: true, select: false })
  hashedRefreshToken: string;

  // User Info
  @Column()
  email: string;
  @Column({ nullable: true })
  nickname: string;
  @Column({ nullable: true })
  profileImage: string;
  @Column({ nullable: true })
  profileImageFilename: string;
  @Column({ nullable: true })
  description: string;

  // User Likes & Reposts
  @ManyToMany(() => Music, (music) => music.likes, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  likeMusics: Music[];
  @ManyToMany(() => Music, (music) => music.reposts, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  repostMusics: Music[];
  @ManyToMany(() => Playlist, (playlist) => playlist.likes, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  likePlaylists: Playlist[];
  @ManyToMany(() => Playlist, (playlist) => playlist.reposts, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable()
  repostPlaylists: Playlist[];

  // Follow
  @ManyToMany(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  followers: User[];
  @ManyToMany(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  @JoinTable()
  following: User[];

  // User Relation column
  @OneToMany(() => Music, (music) => music.user, {
    eager: true,
    onDelete: 'CASCADE',
  })
  musics: Music[];
  @OneToMany(() => Playlist, (playlist) => playlist.user, {
    eager: true,
    onDelete: 'CASCADE',
  })
  playlists: Playlist[];
  @OneToMany(() => Comment, (comment) => comment.user, { onDelete: 'CASCADE' })
  comments: Comment[];

  // History
  @OneToMany(() => History, (history) => history.user)
  historys: History[];

  // Date
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  // Update Function
  @BeforeInsert()
  generateId() {
    const uid = new ShortUniqueId({ length: 12 });
    this.id = uid();
  }
}
