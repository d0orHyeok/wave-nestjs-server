import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  // Comment Data
  @ApiProperty({ description: '댓글내용' })
  @Column()
  text: string;
  @ApiProperty({ description: '댓글 작성된 시점의 음악시간(초)' })
  @Column({ nullable: true })
  commentedAt: number;

  // Create User
  @ApiProperty({ required: false, description: '작성한 유저ID' })
  @Column({ nullable: true, name: 'userId' })
  userId: string;
  @ApiProperty({ required: false, type: User })
  @ManyToOne(() => User, (user) => user.comments, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  // Commented Music
  @ApiProperty({ required: false, description: '댓글 작성된 음악ID' })
  @Column({ nullable: true, name: 'musicId' })
  musicId: number;
  @ManyToOne(() => Music, (music) => music.comments, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @ApiProperty({ required: false, type: Music })
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
