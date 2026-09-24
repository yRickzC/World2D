import { ItemType } from '../../core/configuracao/types';

export interface CraftingIngredient {
  type: ItemType;
  count: number;
}

export type RecipeCategory = 'all' | 'tools' | 'materials' | 'nature' | 'food';

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  category: 'tools' | 'materials' | 'nature' | 'food';
  categoryName: string;
  result: {
    type: ItemType;
    count: number;
  };
  ingredients: CraftingIngredient[];
}
