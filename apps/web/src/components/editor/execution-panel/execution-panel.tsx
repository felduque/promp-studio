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
  chatVersionId,
  defaultModel,
  isDirty,
  editorMode,
  currentContent,
  currentMessages,
  onSaveAndExecute,
  onExecutingChange,
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
  } = useExecutionPanel(
    promptId,
    promptVersionId,
    chatVersionId,
    defaultModel,
    isDirty,
    editorMode,
    currentContent,
    currentMessages,
    onExecutingChange,
  );

  const hasAvailableSelection = selectedModels.length > unavailableSelectedModels.length;

  const hasResults = results.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable config area — everything above the execute button */}
      <div className="flex-1 min-h-0 overflow-y-auto ps-editor-scroll">
        {/* Cost + Tokens Card */}
        <CostEstimator
          selectedModels={selectedModels}
          allModels={allModels}
          inputTokens={inputTokens}
        />

        {/* Model Selection */}
        <div className="px-6 py-4 border-b border-[rgba(70,69,84,0.1)]">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-3 h-3 text-[#c7c4d7]"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 1L13 4V10L7 13L1 10V4L7 1Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">
              Model Selection
            </span>
          </div>
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
        </div>

        {/* Parameters */}
        <div className="px-6 py-4">
          <ParametersPanel
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
          />
        </div>

        {/* Results (inline, scrolls with the rest) */}
        {hasResults && (
          <div className="border-t border-[rgba(70,69,84,0.1)]">
            <ResultsPanel
              results={results}
              allModels={allModels}
              copiedIndex={copiedIndex}
              executing={executing}
              onCopy={copyResult}
            />
          </div>
        )}
      </div>

      {/* Execute Button — sticky at bottom, always visible */}
      <div className="shrink-0 p-6 pt-4 border-t border-[rgba(70,69,84,0.1)] bg-[#131b2e]">
        <ExecuteButton
          executing={executing}
          disabled={!hasAvailableSelection}
          selectedCount={selectedModels.length}
          isDirty={isDirty}
          hasSavedVersion={!!(editorMode === 'chat' ? chatVersionId : promptVersionId)}
          onExecutePreview={() => handleExecute(true)}
          onExecuteSaved={() => handleExecute(false)}
          onSaveAndExecute={onSaveAndExecute}
        />
      </div>
    </div>
  );
}
