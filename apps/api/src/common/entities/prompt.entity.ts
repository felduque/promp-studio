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
import { Project } from './project.entity';
import { PromptVersion } from './prompt-version.entity';
import { ChatVersion } from './chat-version.entity';

@Entity('prompts')
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.prompts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'uuid', nullable: true })
  currentVersionId: string | null;

  @Column({ type: 'uuid', nullable: true })
  currentChatVersionId: string | null;

  @Column({ type: 'varchar', nullable: true })
  defaultModel: string | null;

  @OneToMany(() => PromptVersion, (version) => version.prompt)
  versions: PromptVersion[];

  @OneToMany(() => ChatVersion, (version) => version.prompt)
  chatVersions: ChatVersion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
