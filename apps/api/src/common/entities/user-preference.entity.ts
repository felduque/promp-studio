import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'float', default: 0.7 })
  defaultTemperature: number;

  @Column({ type: 'int', default: 1024 })
  defaultMaxTokens: number;

  @Column({ type: 'float', default: 1.0 })
  defaultTopP: number;

  @Column({ type: 'enum', enum: ['light', 'dark', 'system'], default: 'system' })
  theme: 'light' | 'dark' | 'system';

  @Column({ type: 'int', default: 14 })
  editorFontSize: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
