import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Prompt } from './prompt.entity';
import { Execution } from './execution.entity';
import { User } from './user.entity';

@Entity('prompt_versions')
export class PromptVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  promptId: string;

  @ManyToOne(() => Prompt, (prompt) => prompt.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt;

  @Column()
  versionNumber: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: '[]' })
  variables: {
    name: string;
    type: 'string' | 'number' | 'enum' | 'json';
    defaultValue: string;
    options?: string[];
  }[];

  @Column({ type: 'jsonb', default: '[]' })
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];

  @Column({ nullable: true })
  parentVersionId: string | null;

  @Column({ nullable: true })
  commitMessage: string | null;

  @Column({ nullable: true })
  authorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ nullable: true })
  tag: string | null;

  @OneToMany(() => Execution, (execution) => execution.promptVersion)
  executions: Execution[];

  @CreateDateColumn()
  createdAt: Date;
}
