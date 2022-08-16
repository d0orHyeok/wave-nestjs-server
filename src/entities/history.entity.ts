import { Music } from 'src/entities/music.entity';
import {
  Entity,
  ManyToOne,
  Column,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
  BaseEntity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class History extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  clear: boolean;

  // History whe played the music
  @Column({ nullable: true, name: 'userId' })
  userId: string;
  @ManyToOne(() => User, (user) => user.history, {
    cascade: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  // Music
  @Column({ nullable: true, name: 'musicId' })
  musicId: number;
  @ManyToOne(() => Music, (music) => music.history, {
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
