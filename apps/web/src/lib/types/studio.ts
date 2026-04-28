import type { PromptMessage, PromptVariable } from '@/lib/stores/prompt-store';

export interface AuthorSummary {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
}

export interface PromptVersionData {
  id: string;
  promptId: string;
  versionNumber: number;
  content: string;
  variables: PromptVariable[];
  messages: PromptMessage[];
  parentVersionId: string | null;
  commitMessage: string | null;
  tag: string | null;
  createdAt: string;
  author?: AuthorSummary | null;
}

export interface ChatVersionData {
  id: string;
  promptId: string;
  versionNumber: number;
  systemMessage: string | null;
  userMessage: string | null;
  assistantMessage: string | null;
  messages: PromptMessage[];
  variables: PromptVariable[];
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  } | null;
  provider: string | null;
  model: string | null;
  parentVersionId: string | null;
  commitMessage: string | null;
  tag: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  author?: AuthorSummary | null;
}

export interface PromptData {
  id: string;
  name: string;
  projectId: string;
  currentVersionId: string | null;
  currentChatVersionId: string | null;
  defaultModel: string | null;
  versions: PromptVersionData[];
  chatVersions: ChatVersionData[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateData {
  id: string;
  type: 'prompt';
  owner: 'system' | 'user';
  isSystem: boolean;
  name: string;
  description: string | null;
  content: string;
  variables: PromptVariable[];
  messages: PromptMessage[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatTemplateData {
  id: string;
  type: 'chat';
  owner: 'system' | 'user';
  isSystem: boolean;
  name: string;
  description: string | null;
  systemMessage: string | null;
  userMessage: string | null;
  assistantMessage: string | null;
  messages: PromptMessage[];
  variables: PromptVariable[];
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  } | null;
  provider: string | null;
  model: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromptStudioExport {
  format: 'prompt-studio';
  formatVersion: 1;
  exportedAt: string;
  metadata: {
    app: 'Prompt Studio';
    includesSensitiveData: false;
  };
  prompt?: {
    name: string;
    defaultModel: string | null;
    currentVersionSourceId: string | null;
    currentChatVersionSourceId: string | null;
  };
  promptVersions?: unknown[];
  chatVersions?: unknown[];
  templates?: {
    prompt?: unknown[];
    chat?: unknown[];
  };
}
