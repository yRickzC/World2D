import { BiomeDefinition, BiomeDefinitionJSON } from './BiomeDefinition';
import { BiomeBlocksComponent } from './componentes/BiomeBlocksComponent';
import { BiomeVegetationComponent } from './componentes/BiomeVegetationComponent';
import { BiomeTemperatureComponent } from './componentes/BiomeTemperatureComponent';
import { BiomeHumidityComponent } from './componentes/BiomeHumidityComponent';
import { BiomeClimateOverrideComponent } from './componentes/BiomeClimateOverrideComponent';

export class BiomeRegistry {
  private biomes: Map<string, BiomeDefinition> = new Map();

  constructor() {
    this.initDefaultBiomes();
  }

  private initDefaultBiomes() {
    // 1. Plains (Planície)
    this.register(
      new BiomeDefinition(
        'plains',
        'Planície',
        ['plains', 'temperate', 'open', 'grass'],
        [
          new BiomeBlocksComponent('blocks_plains', {
            surface: { block: 'grass', depth: 1 },
            soil: { block: 'dirt', depth: 3 },
            underground: { block: 'stone' },
            water: { block: 'water' },
          }),
          new BiomeVegetationComponent('veg_plains', {
            entries: [
              { id: 'tall_grass', chance: 0.25 },
              { id: 'flower', chance: 0.12 },
              { id: 'tree_oak', chance: 0.04 },
            ],
          }),
          new BiomeTemperatureComponent('temp_plains', { min: 16, max: 26, base: 21 }),
          new BiomeHumidityComponent('hum_plains', { min: 0.4, max: 0.6, base: 0.5 }),
          new BiomeClimateOverrideComponent('clim_plains', {
            rainChance: 0.2,
            rainIntensity: 0.4,
            fogDensity: 0.15,
          }),
        ],
        'temperate',
        '#84cc16'
      )
    );

    // 2. Forest (Floresta)
    this.register(
      new BiomeDefinition(
        'forest',
        'Floresta',
        ['forest', 'temperate', 'woodland', 'dense_vegetation'],
        [
          new BiomeBlocksComponent('blocks_forest', {
            surface: { block: 'grass', depth: 1 },
            soil: { block: 'dirt', depth: 4 },
            underground: { block: 'stone' },
            water: { block: 'water' },
          }),
          new BiomeVegetationComponent('veg_forest', {
            entries: [
              { id: 'tree_oak', chance: 0.35 },
              { id: 'tree_pine', chance: 0.15 },
              { id: 'bush', chance: 0.2 },
              { id: 'flower', chance: 0.08 },
            ],
          }),
          new BiomeTemperatureComponent('temp_forest', { min: 14, max: 24, base: 19 }),
          new BiomeHumidityComponent('hum_forest', { min: 0.55, max: 0.8, base: 0.68 }),
          new BiomeClimateOverrideComponent('clim_forest', {
            rainChance: 0.5,
            rainIntensity: 0.6,
            fogDensity: 0.2,
          }),
        ],
        'temperate',
        '#15803d'
      )
    );

    // 3. Dense Forest (Bosque Fechado)
    this.register(
      new BiomeDefinition(
        'dense_forest',
        'Bosque Fechado',
        ['dense_forest', 'temperate', 'wilderness'],
        [
          new BiomeBlocksComponent('blocks_dense_forest', {
            surface: { block: 'dense_grass', depth: 1 },
            soil: { block: 'dirt', depth: 4 },
            underground: { block: 'stone' },
          }),
          new BiomeVegetationComponent('veg_dense_forest', {
            entries: [
              { id: 'tree_pine', chance: 0.45 },
              { id: 'tree_oak', chance: 0.3 },
              { id: 'bush', chance: 0.25 },
            ],
          }),
          new BiomeTemperatureComponent('temp_dense_forest', { min: 12, max: 22, base: 17 }),
          new BiomeHumidityComponent('hum_dense_forest', { min: 0.6, max: 0.85, base: 0.72 }),
          new BiomeClimateOverrideComponent('clim_dense_forest', {
            rainChance: 0.6,
            rainIntensity: 0.7,
            fogDensity: 0.4,
          }),
        ],
        'temperate',
        '#166534'
      )
    );

    // 4. Desert (Deserto)
    this.register(
      new BiomeDefinition(
        'desert',
        'Deserto',
        ['desert', 'arid', 'sand', 'dry'],
        [
          new BiomeBlocksComponent('blocks_desert', {
            surface: { block: 'sand', depth: 3 },
            soil: { block: 'sand', depth: 2 },
            underground: { block: 'stone' },
          }),
          new BiomeVegetationComponent('veg_desert', {
            entries: [{ id: 'bush', chance: 0.03 }],
          }),
          new BiomeTemperatureComponent('temp_desert', { min: 28, max: 42, base: 35 }),
          new BiomeHumidityComponent('hum_desert', { min: 0.05, max: 0.2, base: 0.1 }),
          new BiomeClimateOverrideComponent('clim_desert', {
            rainChance: 0.02,
            rainIntensity: 0.1,
            fogDensity: 0.05,
            blockRain: true,
          }),
        ],
        'arid',
        '#facc15'
      )
    );

    // 5. Beach (Praia e Costa)
    this.register(
      new BiomeDefinition(
        'beach',
        'Praia e Costa',
        ['beach', 'coastal', 'sand', 'shore'],
        [
          new BiomeBlocksComponent('blocks_beach', {
            surface: { block: 'sand', depth: 2 },
            soil: { block: 'sand', depth: 2 },
            underground: { block: 'stone' },
            water: { block: 'water' },
          }),
          new BiomeVegetationComponent('veg_beach', {
            entries: [{ id: 'tall_grass', chance: 0.08 }],
          }),
          new BiomeTemperatureComponent('temp_beach', { min: 20, max: 30, base: 25 }),
          new BiomeHumidityComponent('hum_beach', { min: 0.5, max: 0.75, base: 0.65 }),
          new BiomeClimateOverrideComponent('clim_beach', {
            rainChance: 0.25,
            fogDensity: 0.2,
          }),
        ],
        'arid',
        '#fef08a'
      )
    );

    // 6. Swamp (Pântano)
    this.register(
      new BiomeDefinition(
        'swamp',
        'Pântano',
        ['swamp', 'wetland', 'damp', 'mud', 'humid'],
        [
          new BiomeBlocksComponent('blocks_swamp', {
            surface: { block: 'dense_grass', depth: 1 },
            soil: { block: 'dirt', depth: 3 },
            underground: { block: 'stone' },
            water: { block: 'water' },
          }),
          new BiomeVegetationComponent('veg_swamp', {
            entries: [
              { id: 'tree_oak', chance: 0.2 },
              { id: 'bush', chance: 0.35 },
              { id: 'tall_grass', chance: 0.3 },
            ],
          }),
          new BiomeTemperatureComponent('temp_swamp', { min: 20, max: 29, base: 24 }),
          new BiomeHumidityComponent('hum_swamp', { min: 0.75, max: 0.95, base: 0.85 }),
          new BiomeClimateOverrideComponent('clim_swamp', {
            rainChance: 0.8,
            rainIntensity: 0.75,
            fogDensity: 0.6,
            fogChance: 0.5,
          }),
        ],
        'aquatic',
        '#4d7c0f'
      )
    );

    // 7. Caves (Cavernas)
    this.register(
      new BiomeDefinition(
        'caves',
        'Cavernas Subterrâneas',
        ['caves', 'subterranean', 'dark', 'rock'],
        [
          new BiomeBlocksComponent('blocks_caves', {
            surface: { block: 'stone', depth: 10 },
            soil: { block: 'stone', depth: 10 },
            underground: { block: 'stone' },
          }),
          new BiomeVegetationComponent('veg_caves', { entries: [] }),
          new BiomeTemperatureComponent('temp_caves', { min: 10, max: 16, base: 13 }),
          new BiomeHumidityComponent('hum_caves', { min: 0.6, max: 0.8, base: 0.7 }),
          new BiomeClimateOverrideComponent('clim_caves', {
            rainChance: 0.0,
            fogDensity: 0.4,
            blockRain: true,
          }),
        ],
        'subterranean',
        '#71717a'
      )
    );
  }

  register(biome: BiomeDefinition): void {
    this.biomes.set(biome.id, biome);
  }

  get(id: string): BiomeDefinition | undefined {
    return this.biomes.get(id);
  }

  has(id: string): boolean {
    return this.biomes.has(id);
  }

  getAll(): BiomeDefinition[] {
    return Array.from(this.biomes.values());
  }

  delete(id: string): boolean {
    return this.biomes.delete(id);
  }

  duplicate(id: string, newId: string, newName: string): BiomeDefinition | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const cloned = existing.clone();
    cloned.id = newId;
    cloned.name = newName;
    this.register(cloned);
    return cloned;
  }

  toJSON(): BiomeDefinitionJSON[] {
    return this.getAll().map((b) => b.toJSON());
  }

  loadFromJSON(list: BiomeDefinitionJSON[]): void {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      this.register(BiomeDefinition.fromJSON(item));
    }
  }
}

export const globalBiomeRegistry = new BiomeRegistry();
