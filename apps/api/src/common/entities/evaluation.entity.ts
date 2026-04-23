import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Execution } from './execution.entity';
import { User } from './user.entity';

@Entity('evaluations')
@Unique(['executionId', 'userId'])
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  executionId: string;

  @ManyToOne(() => Execution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'executionId' })
  execution: Execution;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', nullable: true })
  rating: number | null; // 1-5 stars

  @Column({ type: 'boolean', nullable: true })
  thumbsUp: boolean | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
