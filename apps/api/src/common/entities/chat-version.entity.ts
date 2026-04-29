import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Prompt } from './prompt.entity';
import { User } from './user.entity';
import type {
  ChatParameters,
  ChatTemplateMessage,
} from './chat-template.entity';
import type { PromptTemplateVariable } from './prompt-template.entity';

@Entity('chat_versions')
export class ChatVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  promptId: string;

  @ManyToOne(() => Prompt, (prompt) => prompt.chatVersions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt;

  @Column()
  versionNumber: number;

  @Column({ type: 'text', nullable: true })
  systemMessage: string | null;

  @Column({ type: 'text', nullable: true })
  userMessage: string | null;

  @Column({ type: 'text', nullable: true })
  assistantMessage: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  messages: ChatTemplateMessage[];

  @Column({ type: 'jsonb', default: '[]' })
  variables: PromptTemplateVariable[];

  @Column({ type: 'jsonb', nullable: true })
  parameters: ChatParameters | null;

  @Column({ type: 'varchar', nullable: true })
  provider: string | null;

  @Column({ type: 'varchar', nullable: true })
  model: string | null;

  @Column({ type: 'uuid', nullable: true })
  parentVersionId: string | null;

  @ManyToOne(() => ChatVersion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentVersionId' })
  parentVersion: ChatVersion | null;

  @Column({ type: 'uuid', nullable: true })
  authorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: User | null;

  @Column({ type: 'varchar', nullable: true })
  commitMessage: string | null;

  @Column({ type: 'varchar', nullable: true })
  tag: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
