'use client';

import { useMemo, useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, KeyRound, Search, AlertTriangle, X, Star } from 'lucide-react';
import { CatalogModel, ProviderModels, ModelFilter } from './types';
import { formatPrice, isFreeModel, filterModels, fetchFavorites, addFavorite, removeFavorite } from './utils';

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

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFavorites().then(setFavorites);
  }, []);

  const handleToggleFavorite = async (modelId: string) => {
    const isFav = favorites.has(modelId);
    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
    try {
      if (isFav) await removeFavorite(modelId);
      else {
        const model = allModels.find((m) => m.id === modelId);
        await addFavorite(modelId, model?.provider);
      }
    } catch {
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(modelId);
        else next.delete(modelId);
        return next;
      });
    }
  };

  const hasApiKeys = providers.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col px-3 pb-3 min-h-0">
        <div className="flex items-center gap-2 py-3 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando modelos...
        </div>
      </div>
    );
  }

  if (!hasApiKeys) {
    return (
      <div className="flex flex-col px-3 pb-3 min-h-0">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <KeyRound className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            No tienes API keys configuradas.
          </p>
          <a
            href="/settings/api-keys"
            className="text-primary text-sm underline underline-offset-2"
          >
            Configurar API Keys
          </a>
        </div>
      </div>
    );
  }

  const filterTabs: { key: ModelFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'favorites', label: '★ Favoritos', count: favorites.size },
    { key: 'selected', label: 'Seleccionados', count: selectedModels.length },
    { key: 'free', label: 'Gratuitos' },
  ];

  const searchResultsEmpty =
    searchQuery &&
    filterModels(
      providers.flatMap((p) => p.models),
      searchQuery,
      modelFilter,
      selectedModels,
      favorites
    ).length === 0;

  return (
    <div className="flex flex-col px-3 pb-3 min-h-0">

      {/* Unavailable models chips */}
      {unavailableSelectedModels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {unavailableSelectedModels.map((modelId) => (
            <span
              key={modelId}
              className="inline-flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 px-2 py-1 rounded text-destructive text-xs transition-colors cursor-pointer"
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
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedModels
            .filter((id) => !unavailableSelectedModels.includes(id))
            .map((modelId) => {
              const model = findModel(modelId);
              if (!model) return null;
              return (
                <span
                  key={modelId}
                  className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded text-primary text-xs transition-colors cursor-pointer"
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
      <div className="flex gap-1.5 mb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
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
        <Search className="top-1/2 left-2.5 absolute w-3.5 h-3.5 text-muted-foreground -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar modelos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-muted/50 px-2.5 py-2 pr-7 pl-8 border rounded-md focus:outline-none focus:ring-1 focus:ring-ring w-full text-sm"
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
      <div className="-mx-1 px-1 overflow-y-auto" style={{ maxHeight: '200px' }}>
        <div className="space-y-2">
          {providers.map((group) => {
            const filteredModels = filterModels(
              group.models,
              searchQuery,
              modelFilter,
              selectedModels,
              favorites
            );

            if (filteredModels.length === 0) return null;

            return (
              <div key={group.provider}>
                <p className="top-0 z-10 sticky bg-background/95 backdrop-blur-sm mb-1 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  {group.label} ({filteredModels.length})
                </p>
                <div className="space-y-0.5">
                  {filteredModels.map((model) => (
                    <div
                      key={model.id}
                      className={`flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded transition-colors ${
                        selectedModels.includes(model.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedModels.includes(model.id)}
                        onCheckedChange={() => onToggleModel(model.id)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(model.id);
                        }}
                        className="hover:bg-muted p-0.5 rounded transition-colors shrink-0"
                        title={favorites.has(model.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      >
                        <Star
                          className={`w-3 h-3 ${
                            favorites.has(model.id)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/40 hover:text-yellow-400'
                          }`}
                        />
                      </button>
                      <label
                        className="flex-1 text-xs truncate cursor-pointer"
                        title={model.label}
                        onClick={() => onToggleModel(model.id)}
                      >
                        {model.label}
                      </label>
                      <span
                        className={`font-mono text-xs shrink-0 ${
                          isFreeModel(model)
                            ? 'text-green-600 font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatPrice(model.pricing.input)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {searchResultsEmpty && (
          <p className="py-4 text-muted-foreground text-sm text-center">
            No se encontraron modelos
          </p>
        )}
      </div>
    </div>
  );
}
