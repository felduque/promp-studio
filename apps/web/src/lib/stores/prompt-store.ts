import { create } from 'zustand';

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'enum' | 'json';
  defaultValue: string;
  value: string;
  options?: string[];
}

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type EditorMode = 'template' | 'chat';

interface PromptEditorState {
  content: string;
  variables: PromptVariable[];
  messages: PromptMessage[];
  isDirty: boolean;
  editorMode: EditorMode;

  setContent: (content: string) => void;
  setEditorMode: (mode: EditorMode) => void;
  setVariables: (variables: PromptVariable[]) => void;
  setVariableValue: (name: string, value: string) => void;
  setMessages: (messages: PromptMessage[]) => void;
  addMessage: (message: PromptMessage) => void;
  updateMessage: (index: number, message: PromptMessage) => void;
  removeMessage: (index: number) => void;
  reorderMessages: (from: number, to: number) => void;
  resetDirty: () => void;
  resolveTemplate: () => string;
  detectVariables: (content: string) => PromptVariable[];
}

export const usePromptStore = create<PromptEditorState>((set, get) => ({
  content: '',
  variables: [],
  messages: [],
  isDirty: false,
  editorMode: 'template',

  setEditorMode: (mode) => set({ editorMode: mode }),

  setContent: (content: string) => {
    const detected = get().detectVariables(content);
    const existing = get().variables;

    const merged = detected.map((v) => {
      const prev = existing.find((e) => e.name === v.name);
      return prev ? { ...v, value: prev.value, defaultValue: prev.defaultValue, type: prev.type, options: prev.options } : v;
    });

    set({ content, variables: merged, isDirty: true });
  },

  setVariables: (variables) => set({ variables, isDirty: true }),

  setVariableValue: (name, value) => {
    const variables = get().variables.map((v) =>
      v.name === name ? { ...v, value } : v,
    );
    set({ variables });
  },

  setMessages: (messages) => set({ messages, isDirty: true }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      isDirty: true,
    })),

  updateMessage: (index, message) =>
    set((state) => {
      const messages = [...state.messages];
      messages[index] = message;
      return { messages, isDirty: true };
    }),

  removeMessage: (index) =>
    set((state) => ({
      messages: state.messages.filter((_, i) => i !== index),
      isDirty: true,
    })),

  reorderMessages: (from, to) =>
    set((state) => {
      const messages = [...state.messages];
      const [moved] = messages.splice(from, 1);
      messages.splice(to, 0, moved);
      return { messages, isDirty: true };
    }),

  resetDirty: () => set({ isDirty: false }),

  resolveTemplate: () => {
    const { content, variables } = get();
    let resolved = content;
    for (const v of variables) {
      const val = v.value || v.defaultValue || `{{${v.name}}}`;
      resolved = resolved.replaceAll(`{{${v.name}}}`, val);
    }
    return resolved;
  },

  detectVariables: (content: string): PromptVariable[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const names = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      names.add(match[1]);
    }
    return Array.from(names).map((name) => ({
      name,
      type: 'string',
      defaultValue: '',
      value: '',
    }));
  },
}));
