import { PromptMessage } from '@/lib/stores/prompt-store';

export interface CatalogModel {
  id: string;
  label: string;
  provider: string;
  pricing: { input: number; output: number };
  maxTokens: number;
  isFree: boolean;
}

export interface ProviderModels {
  provider: string;
  label: string;
  models: CatalogModel[];
}

export interface ExecutionResultData {
  id: string;
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  cost: number;
  messages?: Array<{ role: string; content: string }>; // Preview messages sent
}

export interface ExecutionResult {
  model: string;
  status: 'fulfilled' | 'rejected';
  data?: ExecutionResultData;
  error?: string;
}

export interface ExecutionPanelProps {
  promptId: string;
  promptVersionId: string | null;
  defaultModel?: string | null;
  isDirty?: boolean;
  editorMode?: 'template' | 'chat';
  currentContent?: string;
  currentMessages?: PromptMessage[];
  onSaveAndExecute?: () => void;
}

export type ModelFilter = 'all' | 'selected' | 'free';
