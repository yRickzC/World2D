import { BaseEntityComponent } from './components/BaseEntityComponent';
import { NameComponent } from './components/NameComponent';
import { HealthComponent } from './components/HealthComponent';
import { MovementComponent } from './components/MovementComponent';
import { StyleComponent } from './components/StyleComponent';
import { CombatComponent } from './components/CombatComponent';
import { AIComponent } from './components/AIComponent';
import { InventoryComponent } from './components/InventoryComponent';
import { PhysicsComponent } from './components/PhysicsComponent';
import { EntitySpawnComponent } from './components/EntitySpawnComponent';
import { EntityComponentSerializedData, EntityDefinitionJSON } from './types';

export class EntityDefinition {
  readonly id: string;
  readonly name: string;
  private readonly tags: Set<string>;
  private readonly components: Map<string, BaseEntityComponent>;
  private readonly allComponentsList: BaseEntityComponent[];

  constructor(
    id: string,
    name: string,
    tags: string[] = [],
    components: BaseEntityComponent[] = []
  ) {
    this.id = id;
    this.name = name;
    this.tags = new Set(tags);
    this.components = new Map();
    this.allComponentsList = [...components];

    for (const comp of components) {
      this.components.set(comp.type, comp);
      this.components.set(comp.type.toLowerCase(), comp);
      const clean = comp.type.replace(/Component$/i, '');
      this.components.set(clean, comp);
      this.components.set(clean.toLowerCase(), comp);
      this.components.set(comp.id, comp);
      this.components.set(comp.id.toLowerCase(), comp);
    }
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  getTags(): string[] {
    return Array.from(this.tags);
  }

  hasComponent(typeOrName: string | any): boolean {
    const raw = typeof typeOrName === 'string' ? typeOrName : (typeOrName?.type || typeOrName?.name || '');
    const key = raw.toLowerCase();
    const cleanKey = key.replace(/component$/, '');
    return this.components.has(key) || this.components.has(cleanKey);
  }

  getComponent<T extends BaseEntityComponent>(typeOrName: string | any): T | null {
    const raw = typeof typeOrName === 'string' ? typeOrName : (typeOrName?.type || typeOrName?.name || '');
    const key = raw.toLowerCase();
    const cleanKey = key.replace(/component$/, '');
    return (this.components.get(key) as T) || (this.components.get(cleanKey) as T) || null;
  }

  getSpawnComponent(): any {
    return this.getComponent('EntitySpawn');
  }

  getAllComponents(): BaseEntityComponent[] {
    return [...this.allComponentsList];
  }

  toJSON(): EntityDefinitionJSON {
    return {
      id: this.id,
      name: this.name,
      tags: this.getTags(),
      components: this.allComponentsList.map((c) => c.toJSON()),
    };
  }

  static fromJSON(json: EntityDefinitionJSON): EntityDefinition {
    const instantiatedComponents: BaseEntityComponent[] = [];

    for (const compData of json.components || []) {
      const type = compData.type;
      const data = compData.data || {};
      const id = compData.id;

      switch (type) {
        case 'NameComponent':
          instantiatedComponents.push(new NameComponent(data, id));
          break;
        case 'HealthComponent':
          instantiatedComponents.push(new HealthComponent(data, id));
          break;
        case 'MovementComponent':
          instantiatedComponents.push(new MovementComponent(data, id));
          break;
        case 'StyleComponent':
          instantiatedComponents.push(new StyleComponent(data, id));
          break;
        case 'CombatComponent':
          instantiatedComponents.push(new CombatComponent(data, id));
          break;
        case 'AIComponent':
          instantiatedComponents.push(new AIComponent(data, id));
          break;
        case 'InventoryComponent':
          instantiatedComponents.push(new InventoryComponent(data, id));
          break;
        case 'PhysicsComponent':
          instantiatedComponents.push(new PhysicsComponent(data, id));
          break;
        case 'EntitySpawnComponent':
          instantiatedComponents.push(new EntitySpawnComponent(data, id));
          break;
        default: {
          // Dynamic fallback component
          const dynamicComp = new (class extends BaseEntityComponent {
            readonly type = type;
            get data() {
              return data;
            }
          })(id);
          instantiatedComponents.push(dynamicComp);
          break;
        }
      }
    }

    return new EntityDefinition(
      json.id,
      json.name,
      json.tags || [],
      instantiatedComponents
    );
  }
}
