import grass from './grass.json';
import dense_grass from './dense_grass.json';
import dirt from './dirt.json';
import sand from './sand.json';
import water from './water.json';
import deep_water from './deep_water.json';
import stone from './stone.json';
import wood_plank from './wood_plank.json';
import dug_dirt from './dug_dirt.json';
import torch from './torch.json';
import { BlockDefinitionJSON } from '../../types';

export const CORE_BLOCKS_DATA: BlockDefinitionJSON[] = [
  grass as unknown as BlockDefinitionJSON,
  dense_grass as unknown as BlockDefinitionJSON,
  dirt as unknown as BlockDefinitionJSON,
  sand as unknown as BlockDefinitionJSON,
  water as unknown as BlockDefinitionJSON,
  deep_water as unknown as BlockDefinitionJSON,
  stone as unknown as BlockDefinitionJSON,
  wood_plank as unknown as BlockDefinitionJSON,
  dug_dirt as unknown as BlockDefinitionJSON,
  torch as unknown as BlockDefinitionJSON,
];

export default CORE_BLOCKS_DATA;
