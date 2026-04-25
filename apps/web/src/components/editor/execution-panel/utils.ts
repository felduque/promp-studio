import { apiClient } from '@/lib/api-client';
import { CatalogModel, ModelFilter } from './types';

// --- Favorites (API-backed) ---

export const fetchFavorites = async (): Promise<Set<string>> => {
  try {
    const { data } = await apiClient.get<string[]>('/favorite-models');
    return new Set(data);
  } catch {
    return new Set();
  }
};

export const addFavorite = async (modelId: string, provider?: string): Promise<void> => {
  await apiClient.post('/favorite-models', { modelExternalId: modelId, provider });
};

export const removeFavorite = async (modelId: string): Promise<void> => {
  await apiClient.delete(`/favorite-models/${encodeURIComponent(modelId)}`);
};

// --- Formatting ---

export const formatPrice = (price: number | string): string => {
  const num = Number(price);
  if (num === 0) return 'Free';
  // Price is per token — convert to per million tokens for display
  const perMillion = num * 1_000_000;
  if (perMillion < 0.01) return `$${perMillion.toFixed(4)}/M`;
  if (perMillion < 0.1) return `$${perMillion.toFixed(3)}/M`;
  if (perMillion < 1) return `$${perMillion.toFixed(2)}/M`;
  return `$${perMillion.toFixed(2)}/M`;
};

export const isFreeModel = (model: CatalogModel): boolean => {
  return Number(model.pricing.input) === 0 && Number(model.pricing.output) === 0;
};

// --- Filtering ---

export const filterModels = (
  models: CatalogModel[],
  searchQuery: string,
  modelFilter: ModelFilter,
  selectedModels: string[],
  favorites?: Set<string>
): CatalogModel[] => {
  return models.filter((model) => {
    const matchesSearch =
      searchQuery === '' ||
      model.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (modelFilter === 'selected') {
      return selectedModels.includes(model.id);
    }
    if (modelFilter === 'free') {
      return isFreeModel(model);
    }
    if (modelFilter === 'favorites') {
      return favorites?.has(model.id) ?? false;
    }
    return true;
  });
};
