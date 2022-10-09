import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    required: false,
    default: false,
    description: 'TRUE일 경우 유저는 확인할 수 없다.',
  })
  @Column({ default: false })
  clear: boolean;

  // History whe played the music
  @ApiProperty({ required: false, description: '재생한 유저ID' })
  @Column({ nullable: true, name: 'userId' })
  userId: string;
  @ApiProperty({ required: false, type: User })
  @ManyToOne(() => User, (user) => user.historys, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  // Music
  @ApiProperty({ required: false, description: '재생된 음악ID' })
  @Column({ nullable: true, name: 'musicId' })
  musicId: number;
  @ApiProperty({ required: false, type: Music })
  @ManyToOne(() => Music, (music) => music.history, {
    cascade: true,
  })
  @JoinColumn({ name: 'musicId', referencedColumnName: 'id' })
  music: Music;

  // Date
  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
