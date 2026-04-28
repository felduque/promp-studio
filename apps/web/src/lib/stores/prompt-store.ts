import { create } from 'zustand';

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'enum' | 'json';
  defaultValue: string;
  value?: string;
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
  promptVariables: PromptVariable[];
  chatVariables: PromptVariable[];
  messages: PromptMessage[];
  isDirty: boolean;
  promptDirty: boolean;
  chatDirty: boolean;
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
  resetDirty: (scope?: 'prompt' | 'chat' | 'all') => void;
  hydratePrompt: (content: string, variables: PromptVariable[]) => void;
  hydrateChat: (messages: PromptMessage[], variables?: PromptVariable[]) => void;
  resolveTemplate: () => string;
  detectVariables: (content: string) => PromptVariable[];
}

export const usePromptStore = create<PromptEditorState>((set, get) => ({
  content: '',
  variables: [],
  promptVariables: [],
  chatVariables: [],
  messages: [],
  isDirty: false,
  promptDirty: false,
  chatDirty: false,
  editorMode: 'template',

  setEditorMode: (mode) =>
    set((state) => ({
      editorMode: mode,
      variables: mode === 'chat' ? state.chatVariables : state.promptVariables,
    })),

  setContent: (content: string) => {
    const detected = get().detectVariables(content);
    const existing = get().promptVariables;

    const merged = detected.map((v) => {
      const prev = existing.find((e) => e.name === v.name);
      return prev
        ? {
            ...v,
            value: prev.value,
            defaultValue: prev.defaultValue,
            type: prev.type,
            options: prev.options,
          }
        : v;
    });

    set((state) => ({
      content,
      promptVariables: merged,
      variables: state.editorMode === 'template' ? merged : state.variables,
      promptDirty: true,
      isDirty: true,
    }));
  },

  setVariables: (variables) =>
    set((state) => {
      const patch =
        state.editorMode === 'chat'
          ? { chatVariables: variables, chatDirty: true }
          : { promptVariables: variables, promptDirty: true };
      return {
        ...patch,
        variables,
        isDirty: true,
      };
    }),

  setVariableValue: (name, value) => {
    const state = get();
    const variables = state.variables.map((v) => (v.name === name ? { ...v, value } : v));
    set(
      state.editorMode === 'chat'
        ? { variables, chatVariables: variables }
        : { variables, promptVariables: variables },
    );
  },

  setMessages: (messages) => {
    const detected = get().detectVariables(messages.map((m) => m.content).join('\n'));
    const existing = get().chatVariables;
    const merged = detected.map((v) => {
      const prev = existing.find((e) => e.name === v.name);
      return prev
        ? {
            ...v,
            value: prev.value,
            defaultValue: prev.defaultValue,
            type: prev.type,
            options: prev.options,
          }
        : v;
    });
    set((state) => ({
      messages,
      chatVariables: merged,
      variables: state.editorMode === 'chat' ? merged : state.variables,
      chatDirty: true,
      isDirty: true,
    }));
  },

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      chatDirty: true,
      isDirty: true,
    })),

  updateMessage: (index, message) =>
    set((state) => {
      const messages = [...state.messages];
      messages[index] = message;
      const detected = get().detectVariables(messages.map((m) => m.content).join('\n'));
      const merged = detected.map((v) => {
        const prev = state.chatVariables.find((e) => e.name === v.name);
        return prev
          ? {
              ...v,
              value: prev.value,
              defaultValue: prev.defaultValue,
              type: prev.type,
              options: prev.options,
            }
          : v;
      });
      return {
        messages,
        chatVariables: merged,
        variables: state.editorMode === 'chat' ? merged : state.variables,
        chatDirty: true,
        isDirty: true,
      };
    }),

  removeMessage: (index) =>
    set((state) => {
      const messages = state.messages.filter((_, i) => i !== index);
      const detected = get().detectVariables(messages.map((m) => m.content).join('\n'));
      const merged = detected.map((v) => {
        const prev = state.chatVariables.find((e) => e.name === v.name);
        return prev
          ? {
              ...v,
              value: prev.value,
              defaultValue: prev.defaultValue,
              type: prev.type,
              options: prev.options,
            }
          : v;
      });
      return {
        messages,
        chatVariables: merged,
        variables: state.editorMode === 'chat' ? merged : state.variables,
        chatDirty: true,
        isDirty: true,
      };
    }),

  reorderMessages: (from, to) =>
    set((state) => {
      const messages = [...state.messages];
      const [moved] = messages.splice(from, 1);
      messages.splice(to, 0, moved);
      return { messages, chatDirty: true, isDirty: true };
    }),

  resetDirty: (scope = 'all') =>
    set((state) => {
      const promptDirty = scope === 'all' || scope === 'prompt' ? false : state.promptDirty;
      const chatDirty = scope === 'all' || scope === 'chat' ? false : state.chatDirty;
      return { promptDirty, chatDirty, isDirty: promptDirty || chatDirty };
    }),

  hydratePrompt: (content, variables) =>
    set((state) => ({
      content,
      promptVariables: variables,
      variables: state.editorMode === 'template' ? variables : state.variables,
      promptDirty: false,
      isDirty: state.chatDirty,
    })),

  hydrateChat: (messages, variables) =>
    set((state) => {
      const detected =
        variables ?? get().detectVariables(messages.map((m) => m.content).join('\n'));
      return {
        messages,
        chatVariables: detected,
        variables: state.editorMode === 'chat' ? detected : state.variables,
        chatDirty: false,
        isDirty: state.promptDirty,
      };
    }),

  resolveTemplate: () => {
    const { content, promptVariables } = get();
    let resolved = content;
    for (const v of promptVariables) {
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
