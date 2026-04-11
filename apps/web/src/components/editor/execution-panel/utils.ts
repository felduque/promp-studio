import { CatalogModel } from './types';

export const formatPrice = (price: number | string): string => {
  const num = Number(price);
  if (num === 0) return 'Free';
  if (num < 0.001) return '< $0.001/M';
  if (num < 0.01) return `$${num.toFixed(3)}/M`;
  return `$${num.toFixed(2)}/M`;
};

export const isFreeModel = (model: CatalogModel): boolean => {
  return Number(model.pricing.input) === 0 && Number(model.pricing.output) === 0;
};

export const filterModels = (
  models: CatalogModel[],
  searchQuery: string,
  modelFilter: 'all' | 'selected' | 'free',
  selectedModels: string[]
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
    return true;
  });
};
