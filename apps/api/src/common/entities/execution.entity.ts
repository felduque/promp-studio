import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PromptVersion } from './prompt-version.entity';

@Entity('executions')
export class Execution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  promptVersionId: string;

  @ManyToOne(() => PromptVersion, (version) => version.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promptVersionId' })
  promptVersion: PromptVersion;

  @Column()
  provider: string;

  @Column()
  model: string;

  @Column({ type: 'jsonb' })
  input: Record<string, unknown>;

  @Column({ type: 'text' })
  output: string;

  @Column({ default: 0 })
  tokensIn: number;

  @Column({ default: 0 })
  tokensOut: number;

  @Column({ type: 'float', default: 0 })
  latencyMs: number;

  @Column({ type: 'float', default: 0 })
  cost: number;

  @Column({ type: 'jsonb', nullable: true })
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };

  @CreateDateColumn()
  createdAt: Date;
}
