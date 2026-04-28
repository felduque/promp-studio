import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Execution } from './execution.entity';
import { PromptVersion } from './prompt-version.entity';
import { ChatVersion } from './chat-version.entity';

@Entity('execution_groups')
export class ExecutionGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  promptVersionId: string | null;

  @ManyToOne(() => PromptVersion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'promptVersionId' })
  promptVersion: PromptVersion;

  @Column({ type: 'uuid', nullable: true })
  chatVersionId: string | null;

  @ManyToOne(() => ChatVersion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'chatVersionId' })
  chatVersion: ChatVersion | null;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column('simple-array')
  models: string[];

  @Column({ type: 'jsonb', nullable: true })
  parameters: {
    temperature?: number;
    maxTokens?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  input: Record<string, unknown>;

  @OneToMany(() => Execution, (e) => e.group)
  executions: Execution[];

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
