/**
 * Types and interfaces for the ECS Entity System.
 */

export interface EntityComponentSerializedData {
  id?: string;
  type: string;
  data: Record<string, any>;
}

export interface EntityDefinitionJSON {
  id: string;
  name: string;
  tags: string[];
  components: EntityComponentSerializedData[];
}

export interface EntityValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
