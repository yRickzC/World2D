import { CraftingRecipe } from './Recipe';

export class CraftingDatabase {
  private static readonly recipes: CraftingRecipe[] = [
    {
      id: 'wood_planks',
      name: 'Tábuas de Madeira',
      description: 'Converte 1 tronco de madeira em 4 tábuas aplainadas para pisos e móveis.',
      category: 'materials',
      categoryName: 'Materiais',
      result: { type: 'wood_plank', count: 4 },
      ingredients: [{ type: 'wood', count: 1 }],
    },
    {
      id: 'sticks_wood',
      name: 'Gravetos',
      description: 'Fatia madeira em 4 gravetos firmes, ideais para cabos de ferramentas.',
      category: 'materials',
      categoryName: 'Materiais',
      result: { type: 'stick', count: 4 },
      ingredients: [{ type: 'wood', count: 1 }],
    },
    {
      id: 'sticks_fiber',
      name: 'Gravetos Reforçados',
      description: 'Trança fibras vegetais com galhos secos para produzir gravetos.',
      category: 'materials',
      categoryName: 'Materiais',
      result: { type: 'stick', count: 2 },
      ingredients: [{ type: 'fiber', count: 2 }],
    },
    {
      id: 'torch_craft',
      name: 'Tocha de Campina',
      description: 'Tocha portátil de fogo contínuo para iluminar a escuridão da noite.',
      category: 'materials',
      categoryName: 'Materiais',
      result: { type: 'torch', count: 4 },
      ingredients: [
        { type: 'stick', count: 1 },
        { type: 'fiber', count: 2 },
      ],
    },
    {
      id: 'wooden_axe_craft',
      name: 'Machado Rústico',
      description: 'Machado de madeira que permite cortar árvores muito mais rapidamente que as mãos.',
      category: 'tools',
      categoryName: 'Ferramentas',
      result: { type: 'wooden_axe', count: 1 },
      ingredients: [
        { type: 'wood', count: 3 },
        { type: 'stick', count: 2 },
      ],
    },
    {
      id: 'wooden_pickaxe_craft',
      name: 'Picareta de Madeira',
      description: 'Ferramenta básica para perfurar e quebrar pedras e rochas naturais.',
      category: 'tools',
      categoryName: 'Ferramentas',
      result: { type: 'wooden_pickaxe', count: 1 },
      ingredients: [
        { type: 'wood', count: 3 },
        { type: 'stick', count: 2 },
      ],
    },
    {
      id: 'wooden_shovel_craft',
      name: 'Pá Rústica',
      description: 'Pá de madeira rápida para cavar areia de praia e terra com agilidade.',
      category: 'tools',
      categoryName: 'Ferramentas',
      result: { type: 'wooden_shovel', count: 1 },
      ingredients: [
        { type: 'wood', count: 1 },
        { type: 'stick', count: 2 },
      ],
    },
    {
      id: 'stone_axe_craft',
      name: 'Machado de Pedra',
      description: 'Machado afiado com pedra lascada. Alta durabilidade e força de corte ampliada.',
      category: 'tools',
      categoryName: 'Ferramentas',
      result: { type: 'stone_axe', count: 1 },
      ingredients: [
        { type: 'stone', count: 3 },
        { type: 'stick', count: 2 },
      ],
    },
    {
      id: 'stone_pickaxe_craft',
      name: 'Picareta de Pedra',
      description: 'Picareta sólida de pedra. Força superior contra rochas resistentes.',
      category: 'tools',
      categoryName: 'Ferramentas',
      result: { type: 'stone_pickaxe', count: 1 },
      ingredients: [
        { type: 'stone', count: 3 },
        { type: 'stick', count: 2 },
      ],
    },
    {
      id: 'watering_can_craft',
      name: 'Regador Artesanal',
      description: 'Recipiente de madeira impermeabilizado com fibras para regar vegetação.',
      category: 'tools',
      categoryName: 'Ferramentas',
      result: { type: 'watering_can', count: 1 },
      ingredients: [
        { type: 'wood', count: 4 },
        { type: 'fiber', count: 3 },
      ],
    },
    {
      id: 'seeds_craft',
      name: 'Extrair Sementes',
      description: 'Separa as sementes férteis de flores silvestres para novos plantios.',
      category: 'nature',
      categoryName: 'Natureza',
      result: { type: 'seed', count: 3 },
      ingredients: [{ type: 'flower', count: 1 }],
    },
    {
      id: 'apple_snack',
      name: 'Porção de Frutas Silvestres',
      description: 'Prepara maçãs frescas revigorantes combinando bagas colhidas da mata.',
      category: 'food',
      categoryName: 'Alimentos',
      result: { type: 'apple', count: 1 },
      ingredients: [{ type: 'berries', count: 3 }],
    },
  ];

  static getAll(): CraftingRecipe[] {
    return this.recipes;
  }

  static getByCategory(category: string): CraftingRecipe[] {
    if (category === 'all') return this.recipes;
    return this.recipes.filter((r) => r.category === category);
  }

  static getById(id: string): CraftingRecipe | undefined {
    return this.recipes.find((r) => r.id === id);
  }
}
