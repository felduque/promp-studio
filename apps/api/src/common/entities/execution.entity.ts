import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PromptVersion } from './prompt-version.entity';
import { User } from './user.entity';
import { ExecutionGroup } from './execution-group.entity';
import { ChatVersion } from './chat-version.entity';

export type ExecutionSource = 'prompt' | 'chat';

@Entity('executions')
export class Execution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  promptVersionId: string | null;

  @ManyToOne(() => PromptVersion, (version) => version.executions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'promptVersionId' })
  promptVersion: PromptVersion;

  @Column({ nullable: true })
  chatVersionId: string | null;

  @ManyToOne(() => ChatVersion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'chatVersionId' })
  chatVersion: ChatVersion | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  groupId: string | null;

  @ManyToOne(() => ExecutionGroup, (g) => g.executions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'groupId' })
  group: ExecutionGroup;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: ['prompt', 'chat'], default: 'prompt' })
  @Index()
  source: ExecutionSource;

  @Column()
  @Index()
  provider: string;

  @Column()
  @Index()
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

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
