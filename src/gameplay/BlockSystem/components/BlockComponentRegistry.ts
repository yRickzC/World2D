import { BaseBlockComponent } from './BaseBlockComponent';
import { BreakableComponent } from './BreakableComponent';
import { CollisionComponent } from './CollisionComponent';
import { ColorTextureComponent } from './ColorTextureComponent';
import { DynamicBlockComponent } from './DynamicBlockComponent';
import { EmojiIconComponent } from './EmojiIconComponent';
import { FluidComponent } from './FluidComponent';
import { LightComponent } from './LightComponent';
import { SideTextureComponent } from './SideTextureComponent';
import { SolidComponent } from './SolidComponent';
import { TopTextureComponent } from './TopTextureComponent';
import { TransparentComponent } from './TransparentComponent';
import { BlockComponentSchemaDefinition } from '../types';

export type BlockComponentFactory = (id: string, data: Record<string, any>) => BaseBlockComponent;

export interface ComponentClassWithSchema {
  readonly type: string;
  readonly schema: BlockComponentSchemaDefinition;
  new (config: any): BaseBlockComponent;
}

export class BlockComponentRegistry {
  private static readonly factories = new Map<string, BlockComponentFactory>();
  private static readonly schemas = new Map<string, BlockComponentSchemaDefinition>();

  static {
    this.registerDefaults();
  }

  private static registerDefaults(): void {
    const coreComponents: { cls: ComponentClassWithSchema; aliases?: string[] }[] = [
      { cls: SolidComponent as any, aliases: ['solid'] },
      { cls: BreakableComponent as any, aliases: ['breakable'] },
      { cls: ColorTextureComponent as any, aliases: ['color_texture'] },
      { cls: TopTextureComponent as any, aliases: ['top_texture'] },
      { cls: SideTextureComponent as any, aliases: ['side_texture'] },
      { cls: EmojiIconComponent as any, aliases: ['emoji_icon'] },
      { cls: FluidComponent as any, aliases: ['fluid'] },
      { cls: LightComponent as any, aliases: ['light'] },
      { cls: TransparentComponent as any, aliases: ['transparent'] },
      { cls: CollisionComponent as any, aliases: ['collision'] },
      { cls: DynamicBlockComponent as any, aliases: ['dynamic'] },
    ];

    for (const { cls, aliases } of coreComponents) {
      const type = cls.schema?.type || cls.type;
      const schema = cls.schema;
      const factory: BlockComponentFactory = (id, data) => new cls({ id, ...data });

      this.register(type, factory, schema);

      if (aliases) {
        for (const alias of aliases) {
          this.factories.set(alias, factory);
          if (schema) {
            this.schemas.set(alias, schema);
          }
        }
      }
    }
  }

  static register(
    type: string,
    factory: BlockComponentFactory,
    schema?: BlockComponentSchemaDefinition
  ): void {
    this.factories.set(type, factory);
    if (schema) {
      this.schemas.set(type, schema);
    }
  }

  static get(type: string): BlockComponentFactory | undefined {
    return this.factories.get(type);
  }

  static getSchema(type: string): BlockComponentSchemaDefinition | undefined {
    return this.schemas.get(type);
  }

  static getAllSchemas(): BlockComponentSchemaDefinition[] {
    const uniqueSchemas = new Map<string, BlockComponentSchemaDefinition>();
    for (const schema of this.schemas.values()) {
      if (!uniqueSchemas.has(schema.type)) {
        uniqueSchemas.set(schema.type, schema);
      }
    }
    return Array.from(uniqueSchemas.values());
  }

  static has(type: string): boolean {
    return this.factories.has(type);
  }

  static getRegisteredTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}
