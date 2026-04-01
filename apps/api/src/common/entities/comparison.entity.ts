import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Prompt } from './prompt.entity';

@Entity('comparisons')
export class Comparison {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  promptId: string;

  @ManyToOne(() => Prompt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt;

  @Column({ type: 'jsonb', default: '[]' })
  executionIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  ratings: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;
}
