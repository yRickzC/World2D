export type ItemCategory =
  | 'tool'
  | 'weapon'
  | 'food'
  | 'material'
  | 'nature'
  | 'block'
  | 'utility';

export interface ComponentSerializedData {
  id: string;
  type: string;
  data: Record<string, any>;
}

export interface ItemDefinitionJSON {
  id: string;
  nome: string;
  categoria: ItemCategory | string;
  components: ComponentSerializedData[];
}

export type ItemHookType = 'onUse' | 'onUpdate' | 'onConsume' | 'onRender' | 'onDestroy';

export type ItemEventType =
  | 'item.created'
  | 'item.destroyed'
  | 'item.updated'
  | 'item.loop'
  | 'item.used'
  | 'item.consumed'
  | 'item.dropped'
  | 'item.picked_up'
  | 'item.equipped'
  | 'item.unequipped'
  | 'item.render'
  | 'item.rendered'
  | 'item.component_created'
  | 'item.component_destroyed';

export interface ItemEventPayload {
  itemId: string;
  instanceId?: string;
  componentId?: string;
  componentType?: string;
  timestamp: number;
  data?: any;
}

export type ItemEventListener = (event: ItemEventPayload) => void;

export interface ComponentSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  allowedValues?: any[];
  description?: string;
}

export interface ComponentSchema {
  type: string;
  version: string;
  description: string;
  isDynamic: boolean;
  requires?: string[];
  properties: Record<string, ComponentSchemaProperty>;
}
