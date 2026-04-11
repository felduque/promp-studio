'use client';

import { useExecutionPanel } from './use-execution-panel';
import { ExecutionPanelProps } from './types';
import { ModelSelector } from './model-selector';
import { ParametersPanel } from './parameters-panel';
import { CostEstimator } from './cost-estimator';
import { ExecuteButton } from './execute-button';
import { ResultsPanel } from './results-panel';

export function ExecutionPanel({
  promptId,
  promptVersionId,
  defaultModel,
  isDirty,
  editorMode,
  currentContent,
  currentMessages,
  onSaveAndExecute,
}: ExecutionPanelProps) {
  const {
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
  } = useExecutionPanel(promptId, promptVersionId, defaultModel, isDirty, editorMode, currentContent, currentMessages);

  const hasAvailableSelection =
    selectedModels.length > unavailableSelectedModels.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ModelSelector
        providers={providers}
        loading={loading}
        selectedModels={selectedModels}
        unavailableSelectedModels={unavailableSelectedModels}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        modelFilter={modelFilter}
        onFilterChange={setModelFilter}
        onToggleModel={toggleModel}
        onRemoveUnavailable={removeUnavailableModel}
      />

      <ParametersPanel
        temperature={temperature}
        onTemperatureChange={setTemperature}
        maxTokens={maxTokens}
        onMaxTokensChange={setMaxTokens}
      />

      <CostEstimator
        selectedModels={selectedModels}
        allModels={allModels}
        inputTokens={inputTokens}
      />

      <ExecuteButton
        executing={executing}
        disabled={!hasAvailableSelection}
        selectedCount={selectedModels.length}
        isDirty={isDirty}
        hasSavedVersion={!!promptVersionId}
        onExecutePreview={() => handleExecute(true)}
        onExecuteSaved={() => handleExecute(false)}
        onSaveAndExecute={onSaveAndExecute}
      />

      <ResultsPanel
        results={results}
        allModels={allModels}
        copiedIndex={copiedIndex}
        executing={executing}
        onCopy={copyResult}
      />
    </div>
  );
}
