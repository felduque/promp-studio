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
    
    // If using preview but no preview data available, fall back to saved version
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
      if (actuallyUsePreview) {
        // Preview execution (no saving)
        if (selectedModels.length === 1) {
          const { data } = await apiClient.post('/executions/preview', {
            model: selectedModels[0],
            content: editorMode === 'template' ? currentContent : undefined,
            messages: editorMode === 'chat' ? currentMessages : undefined,
            variables: variablesMap,
            temperature,
            maxTokens,
          });
          setResults([{ model: selectedModels[0], status: 'fulfilled', data }]);
        } else {
          // Batch preview - execute sequentially
          const results = await Promise.allSettled(
            selectedModels.map((model) =>
              apiClient.post('/executions/preview', {
                model,
                content: editorMode === 'template' ? currentContent : undefined,
                messages: editorMode === 'chat' ? currentMessages : undefined,
                variables: variablesMap,
                temperature,
                maxTokens,
              })
            )
          );
          const formattedResults = results.map((result, index) => ({
            model: selectedModels[index],
            status: result.status === 'fulfilled' ? 'fulfilled' as const : 'rejected' as const,
            data: result.status === 'fulfilled' ? (result as PromiseFulfilledResult<any>).value?.data : undefined,
            error: result.status === 'rejected' ? (result as PromiseRejectedResult).reason?.response?.data?.message || (result as PromiseRejectedResult).reason?.message : undefined,
          }));
          setResults(formattedResults);
        }
      } else {
        // Normal execution using saved version
        if (selectedModels.length === 1) {
          const { data } = await apiClient.post('/executions', {
            promptVersionId,
            model: selectedModels[0],
            variables: variablesMap,
            temperature,
            maxTokens,
          });
          setResults([{ model: selectedModels[0], status: 'fulfilled', data }]);
        } else {
          const { data } = await apiClient.post('/executions/batch', {
            executions: selectedModels.map((model) => ({
              promptVersionId,
              model,
              variables: variablesMap,
              temperature,
              maxTokens,
            })),
          });
          setResults(data);
        }
      }
    } catch (err: any) {
      setResults([
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
