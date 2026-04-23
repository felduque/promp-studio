import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestCase } from './test-case.entity';
import { Execution } from './execution.entity';

export type TestRunStatus = 'passed' | 'failed' | 'error';

export interface AssertionResult {
  type: string;
  value: string;
  passed: boolean;
  actual?: string;
}

@Entity('test_runs')
export class TestRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  testCaseId: string;

  @ManyToOne(() => TestCase, (tc) => tc.runs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testCaseId' })
  testCase: TestCase;

  @Column({ nullable: true })
  executionId: string | null;

  @ManyToOne(() => Execution, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'executionId' })
  execution: Execution;

  @Column({ type: 'enum', enum: ['passed', 'failed', 'error'] })
  status: TestRunStatus;

  @Column({ type: 'text', nullable: true })
  actualOutput: string | null;

  @Column({ type: 'jsonb', default: [] })
  assertionResults: AssertionResult[];

  @Column({ type: 'float', default: 0 })
  latencyMs: number;

  @Column({ type: 'varchar', nullable: true })
  model: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
