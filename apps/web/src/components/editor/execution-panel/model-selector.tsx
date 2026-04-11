'use client';

import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, Search, AlertTriangle, X } from 'lucide-react';
import { CatalogModel, ProviderModels, ModelFilter } from './types';
import { formatPrice, isFreeModel, filterModels } from './utils';

interface ModelSelectorProps {
  providers: ProviderModels[];
  loading: boolean;
  selectedModels: string[];
  unavailableSelectedModels: string[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  modelFilter: ModelFilter;
  onFilterChange: (filter: ModelFilter) => void;
  onToggleModel: (modelId: string) => void;
  onRemoveUnavailable: (modelId: string) => void;
}

export function ModelSelector({
  providers,
  loading,
  selectedModels,
  unavailableSelectedModels,
  searchQuery,
  onSearchChange,
  modelFilter,
  onFilterChange,
  onToggleModel,
  onRemoveUnavailable,
}: ModelSelectorProps) {
  const allModels = useMemo(
    () => providers.flatMap((p) => p.models),
    [providers]
  );

  const findModel = (id: string): CatalogModel | undefined =>
    allModels.find((m) => m.id === id);

  const hasApiKeys = providers.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col p-3 border-b min-h-0">
        <Label className="mb-2 font-medium text-xs">Modelos</Label>
        <div className="flex items-center gap-2 py-3 text-muted-foreground text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          Cargando modelos...
        </div>
      </div>
    );
  }

  if (!hasApiKeys) {
    return (
      <div className="flex flex-col p-3 border-b min-h-0">
        <Label className="mb-2 font-medium text-xs">Modelos</Label>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <KeyRound className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-muted-foreground text-xs">
            No tienes API keys configuradas.
          </p>
          <a
            href="/settings/api-keys"
            className="text-primary text-xs underline underline-offset-2"
          >
            Configurar API Keys
          </a>
        </div>
      </div>
    );
  }

  const filterTabs: { key: ModelFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'selected', label: 'Seleccionados', count: selectedModels.length },
    { key: 'free', label: 'Gratuitos' },
  ];

  const searchResultsEmpty =
    searchQuery &&
    providers.flatMap((p) => p.models).filter((m) => {
      const matches =
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (modelFilter === 'selected')
        return matches && selectedModels.includes(m.id);
      if (modelFilter === 'free') return matches && isFreeModel(m);
      return matches;
    }).length === 0;

  return (
    <div className="flex flex-col p-3 border-b min-h-0">
      <Label className="mb-2 font-medium text-xs">Modelos</Label>

      {/* Unavailable models chips */}
      {unavailableSelectedModels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {unavailableSelectedModels.map((modelId) => (
            <span
              key={modelId}
              className="inline-flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 px-2 py-0.5 rounded text-[10px] text-destructive transition-colors cursor-pointer"
              onClick={() => onRemoveUnavailable(modelId)}
              title="Modelo no disponible - click para quitar"
            >
              <AlertTriangle className="w-3 h-3" />
              {modelId}
              <X className="w-3 h-3" />
            </span>
          ))}
        </div>
      )}

      {/* Available selected models chips */}
      {selectedModels.length > unavailableSelectedModels.length && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedModels
            .filter((id) => !unavailableSelectedModels.includes(id))
            .map((modelId) => {
              const model = findModel(modelId);
              if (!model) return null;
              return (
                <span
                  key={modelId}
                  className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded text-[10px] text-primary transition-colors cursor-pointer"
                  onClick={() => onToggleModel(modelId)}
                  title="Click para quitar"
                >
                  {model.label}
                  <span className="text-primary/60">×</span>
                </span>
              );
            })}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`px-2 py-1 rounded text-[10px] transition-colors ${
              modelFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative mb-2">
        <Search className="top-1/2 left-2 absolute w-3 h-3 text-muted-foreground -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar modelos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-muted/50 px-2 py-1.5 pr-6 pl-7 border rounded focus:outline-none focus:ring-1 focus:ring-ring w-full text-xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="top-1/2 right-1 absolute p-0.5 text-muted-foreground hover:text-foreground -translate-y-1/2"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Models list */}
      <ScrollArea className="flex-1 -mx-1 px-1 min-h-30 max-h-50">
        <div className="space-y-2">
          {providers.map((group) => {
            const filteredModels = filterModels(
              group.models,
              searchQuery,
              modelFilter,
              selectedModels
            );

            if (filteredModels.length === 0) return null;

            return (
              <div key={group.provider}>
                <p className="top-0 z-10 sticky bg-background/95 backdrop-blur-sm mb-1 py-0.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                  {group.label} ({filteredModels.length})
                </p>
                <div className="space-y-0.5">
                  {filteredModels.map((model) => (
                    <label
                      key={model.id}
                      className={`flex items-center gap-2 hover:bg-muted/50 px-1 py-1 rounded cursor-pointer transition-colors ${
                        selectedModels.includes(model.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedModels.includes(model.id)}
                        onCheckedChange={() => onToggleModel(model.id)}
                      />
                      <span
                        className="flex-1 text-xs truncate"
                        title={model.label}
                      >
                        {model.label}
                      </span>
                      <span
                        className={`font-mono text-[10px] shrink-0 ${
                          isFreeModel(model)
                            ? 'text-green-600 font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatPrice(model.pricing.input)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {searchResultsEmpty && (
          <p className="py-4 text-muted-foreground text-xs text-center">
            No se encontraron modelos
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
