import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Prompt } from './prompt.entity';
import { TestRun } from './test-run.entity';

export type AssertionType = 'contains' | 'equals' | 'validJSON' | 'regex' | 'notContains';

export interface Assertion {
  type: AssertionType;
  value: string;
}

@Entity('test_cases')
export class TestCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  promptId: string;

  @ManyToOne(() => Prompt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt;

  @Column({ type: 'jsonb', default: {} })
  variables: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  expectedOutput: string | null;

  @Column({ type: 'jsonb', default: [] })
  assertions: Assertion[];

  @OneToMany(() => TestRun, (run) => run.testCase)
  runs: TestRun[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
