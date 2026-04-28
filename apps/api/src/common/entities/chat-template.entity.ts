import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import type { PromptTemplateVariable } from './prompt-template.entity';

export type ChatTemplateMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatParameters = {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
};

@Entity('chat_templates')
export class ChatTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ default: false })
  @Index()
  isSystem: boolean;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

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

  @Column({ nullable: true })
  provider: string | null;

  @Column({ nullable: true })
  model: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
