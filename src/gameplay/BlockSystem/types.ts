export type BlockCategory =
  | 'natural'
  | 'building'
  | 'liquid'
  | 'utility'
  | 'decoration'
  | 'ore';

export interface BlockComponentSerializedData {
  id: string;
  type: string;
  data: Record<string, any>;
}

export interface BlockDefinitionJSON {
  id: string;
  name: string;
  category?: BlockCategory | string;
  tags?: string[];
  components: BlockComponentSerializedData[];
}

export type BlockEventType =
  | 'block.created'
  | 'block.destroyed'
  | 'block.updated'
  | 'block.placed'
  | 'block.broken'
  | 'block.interacted'
  | 'block.tick'
  | 'block.loaded'
  | 'block.unloaded';

export interface BlockEventPayload {
  blockId: string;
  instanceId?: string;
  x?: number;
  y?: number;
  chunkKey?: string;
  timestamp: number;
  data?: any;
}

export type BlockEventListener = (event: BlockEventPayload) => void;

export interface BlockPropertySchema {
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  allowedValues?: any[];
  description: string;
  editor?: {
    widget?: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'color' | 'slider';
    placeholder?: string;
  };
}

export interface BlockComponentSchemaDefinition {
  type: string;
  name: string;
  version: string;
  description: string;
  isDynamic: boolean;
  isSingleton?: boolean;
  incompatibleWith?: string[];
  requires?: string[];
  properties: Record<string, BlockPropertySchema>;
  runtime?: {
    hooks?: ('onPlaced' | 'onDestroyed' | 'onTick' | 'onInteract' | 'render')[];
    priority?: number;
  };
  editor?: {
    category?: string;
    icon?: string;
  };
}

export interface BlockSystemError {
  system: 'BlockSystem';
  object_id: string;
  component?: string;
  reason: string;
}

export interface BlockValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  errorDetails: BlockSystemError[];
}
