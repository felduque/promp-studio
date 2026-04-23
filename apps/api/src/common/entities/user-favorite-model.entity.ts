import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_favorite_models')
@Unique(['userId', 'modelExternalId'])
export class UserFavoriteModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  modelExternalId: string;

  @Column({ nullable: true })
  provider: string;

  @CreateDateColumn()
  createdAt: Date;
}
