import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'groq' | 'openrouter' | 'mistral';

@Entity('provider_models')
export class ProviderModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['openai', 'anthropic', 'google', 'groq', 'openrouter', 'mistral'] })
  @Index()
  provider: ProviderType;

  @Column()
  externalId: string; // ID original del proveedor (ej: gpt-4o, claude-3-5-sonnet, etc)

  @Column()
  name: string; // Nombre legible para mostrar

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: {} })
  capabilities: {
    maxTokens?: number;
    contextWindow?: number;
    supportsVision?: boolean;
    supportsTools?: boolean;
    supportsJson?: boolean;
  };

  @Column({ type: 'jsonb', default: {} })
  pricing: {
    input: number; // Precio por 1M tokens de entrada
    output: number; // Precio por 1M tokens de salida
    currency: string; // normalmente USD
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFree: boolean;

  @Column({ type: 'text', nullable: true })
  rawData: string | null; // Datos crudos del proveedor por si necesitamos referencia

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
