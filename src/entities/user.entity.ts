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
  description: string;

  // User Likes & Reposts
  @ManyToMany(() => Music, (music) => music.likes, { cascade: true })
  @JoinTable()
  likeMusics: Music[];
  @ManyToMany(() => Music, (music) => music.reposts, { cascade: true })
  @JoinTable()
  repostMusics: Music[];
  @ManyToMany(() => Playlist, (playlist) => playlist.likes, { cascade: true })
  @JoinTable()
  likePlaylists: Playlist[];
  @ManyToMany(() => Playlist, (playlist) => playlist.reposts, { cascade: true })
  @JoinTable()
  repostPlaylists: Playlist[];

  // Follow
  @ManyToMany(() => User, (user) => user.following)
  followers: User[];
  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable()
  following: User[];

  // User Relation column
  @OneToMany(() => Music, (music) => music.user, { eager: true })
  musics: Music[];
  @OneToMany(() => Playlist, (playlist) => playlist.user, { eager: true })
  playlists: Playlist[];
  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  // History
  @OneToMany(() => History, (history) => history.user)
  history: History[];

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
