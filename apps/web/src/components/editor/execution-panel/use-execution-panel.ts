'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePromptStore, PromptMessage } from '@/lib/stores/prompt-store';
import { ProviderModels, ExecutionResult, ModelFilter } from './types';

export function useExecutionPanel(
  promptId: string,
  promptVersionId: string | null,
  defaultModel?: string | null,
  isDirty?: boolean,
  editorMode?: 'template' | 'chat',
  currentContent?: string,
  currentMessages?: PromptMessage[]
) {
  const { variables, resolveTemplate } = usePromptStore();

  const [providers, setProviders] = useState<ProviderModels[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModels, setSelectedModels] = useState<string[]>(
    defaultModel ? [defaultModel] : []
  );
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('all');

  const resolved = resolveTemplate();
  const inputTokens = useMemo(() => {
    const { estimateTokens } = require('@/lib/utils/token-counter');
    return estimateTokens(resolved);
  }, [resolved]);

  const allModels = useMemo(
    () => providers.flatMap((p) => p.models),
    [providers]
  );

  const allModelIds = useMemo(() => allModels.map((m) => m.id), [allModels]);

  const unavailableSelectedModels = useMemo(
    () => selectedModels.filter((id) => !allModelIds.includes(id)),
    [selectedModels, allModelIds]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<ProviderModels[]>(
          '/executions/models'
        );
        if (!cancelled) {
          setProviders(data);
          if (selectedModels.length === 0 && data.length > 0) {
            const firstModel = data[0].models[0]?.id;
            if (firstModel) setSelectedModels([firstModel]);
          }
        }
      } catch {
        // No models available
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDefaultModel = useCallback(
    async (modelId: string) => {
      try {
        await apiClient.patch(`/prompts/${promptId}/default-model`, {
          defaultModel: modelId,
        });
      } catch {
        // Silent fail
      }
    },
    [promptId]
  );

  const toggleModel = useCallback(
    (modelId: string) => {
      setSelectedModels((prev) => {
        const next = prev.includes(modelId)
          ? prev.filter((m) => m !== modelId)
          : [...prev, modelId];
        if (next.length > 0) saveDefaultModel(next[0]);
        return next;
      });
    },
    [saveDefaultModel]
  );

  const removeUnavailableModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => prev.filter((m) => m !== modelId));
  }, []);

  const handleExecute = useCallback(async (usePreview = false) => {
    if (selectedModels.length === 0) return;
    
    const canUsePreview = isDirty && (currentContent || (currentMessages && currentMessages.length > 0));
    const actuallyUsePreview = usePreview && canUsePreview;
    
    if (!actuallyUsePreview && !promptVersionId) return;
    
    setExecuting(true);
    setResults([]);

    const variablesMap: Record<string, string> = {};
    for (const v of variables) {
      variablesMap[v.name] = v.value || v.defaultValue || '';
    }

    try {
      if (selectedModels.length === 1) {
        // Single model — direct call, no streaming needed
        const endpoint = actuallyUsePreview ? '/executions/preview' : '/executions';
        const payload = actuallyUsePreview
          ? {
              model: selectedModels[0],
              source: editorMode === 'chat' ? 'chat' : 'prompt',
              content: editorMode === 'template' ? currentContent : undefined,
              messages: editorMode === 'chat' ? currentMessages : undefined,
              variables: variablesMap,
              temperature,
              maxTokens,
            }
          : {
              promptVersionId,
              model: selectedModels[0],
              source: editorMode === 'chat' ? 'chat' : 'prompt',
              variables: variablesMap,
              temperature,
              maxTokens,
            };

        const { data } = await apiClient.post(endpoint, payload);
        setResults([{ model: selectedModels[0], status: 'fulfilled', data }]);
      } else {
        // Multiple models — use SSE stream for progressive results
        const payload = {
          models: selectedModels,
          promptVersionId: actuallyUsePreview ? undefined : promptVersionId,
          source: editorMode === 'chat' ? 'chat' : 'prompt',
          content: actuallyUsePreview && editorMode === 'template' ? currentContent : undefined,
          messages: actuallyUsePreview && editorMode === 'chat' ? currentMessages : undefined,
          variables: variablesMap,
          temperature,
          maxTokens,
        };

        // Get auth token for the fetch request
        const token = localStorage.getItem('access_token');

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(
          `${apiBase}/api/executions/stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok || !response.body) {
          throw new Error(`Stream failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (!json) continue;

            try {
              const event = JSON.parse(json);
              if (event.type === 'done') continue;
              if (event.type === 'error') {
                setResults((prev) => [...prev, { model: '', status: 'rejected', error: event.error }]);
                continue;
              }
              if (event.status === 'validation' && event.invalidModels) {
                // Models that don't exist — show as rejected
                for (const m of event.invalidModels) {
                  setResults((prev) => [...prev, { model: m, status: 'rejected', error: 'Modelo no disponible o inexistente en el catálogo' }]);
                }
                continue;
              }
              // Append each result as it arrives
              setResults((prev) => [...prev, event]);
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err: any) {
      setResults((prev) => [
        ...prev,
        {
          model: selectedModels[0],
          status: 'rejected',
          error: err?.response?.data?.message || err.message,
        },
      ]);
    } finally {
      setExecuting(false);
    }
  }, [
    promptVersionId,
    selectedModels,
    variables,
    temperature,
    maxTokens,
    isDirty,
    editorMode,
    currentContent,
    currentMessages,
  ]);

  const copyResult = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  return {
    providers,
    loading,
    selectedModels,
    unavailableSelectedModels,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    executing,
    results,
    copiedIndex,
    searchQuery,
    setSearchQuery,
    modelFilter,
    setModelFilter,
    allModels,
    inputTokens,
    toggleModel,
    removeUnavailableModel,
    handleExecute,
    copyResult,
  };
}
