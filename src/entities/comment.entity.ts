import { Music } from 'src/entities/music.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Comment Data
  @Column()
  text: string;
  @Column({ nullable: true })
  commentedAt: number;

  // Create User
  @Column({ nullable: true, name: 'userId' })
  userId: string;
  @ManyToOne(() => User, (user) => user.comments, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  // Commented Music
  @Column({ nullable: true, name: 'musicId' })
  musicId: number;
  @ManyToOne(() => Music, (music) => music.comments, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'musicId', referencedColumnName: 'id' })
  music: Music;

  // Date
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
