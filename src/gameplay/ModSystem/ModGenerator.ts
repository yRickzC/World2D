import { CoreSystem } from '../../core/CoreSystem';
import { BlockDefinitionJSON } from '../BlockSystem/types';
import { ItemDefinitionJSON } from '../ItemSystem/types';
import { ModValidator } from './ModValidator';
import { ModPackage, ModValidationReport } from './types';

export class ModGenerator {
  /**
   * Creates a clean, standardized ModPackage scaffold.
   * Steps 1-4 of Mod Creation:
   * 1. Define mod_id
   * 2. Define mod_version
   * 3. Define core_version
   * 4. Declare dependencies
   */
  static createModScaffold(
    modId: string,
    options?: {
      name?: string;
      description?: string;
      version?: string;
      coreVersion?: string;
      dependencies?: string[];
    }
  ): ModPackage {
    const cleanModId = modId.replace(/^@/, '').toLowerCase().trim();

    return {
      manifest: {
        mod_id: cleanModId,
        mod_version: options?.version || '0.0.1',
        core_version: options?.coreVersion || CoreSystem.getVersion(),
        dependencias: options?.dependencies || [],
        name: options?.name || cleanModId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: options?.description || `Mod ${cleanModId} utilizando Core Base Components Arch`,
      },
      definitions: {
        blocks: [],
        items: [],
      },
      assets: {},
    };
  }

  /**
   * Adds a Block Definition to the Mod using Core components.
   * Step 5 & 7: Creates definition with strict namespace enforcement (@mod_id:object_id).
   */
  static addBlockDefinition(
    pkg: ModPackage,
    blockJson: BlockDefinitionJSON
  ): { success: boolean; error?: string } {
    const modId = pkg.manifest.mod_id;
    const expectedPrefix = `@${modId}:`;

    // Ensure proper namespace
    let finalId = blockJson.id;
    if (!finalId.startsWith(expectedPrefix)) {
      finalId = `${expectedPrefix}${finalId.replace(/^@?[^:]*:/, '')}`;
    }

    const definition: BlockDefinitionJSON = {
      ...blockJson,
      id: finalId,
    };

    if (!pkg.definitions.blocks) {
      pkg.definitions.blocks = [];
    }

    // Replace if exists, or append
    const idx = pkg.definitions.blocks.findIndex((b) => b.id === finalId);
    if (idx >= 0) {
      pkg.definitions.blocks[idx] = definition;
    } else {
      pkg.definitions.blocks.push(definition);
    }

    return { success: true };
  }

  /**
   * Adds an Item Definition to the Mod using Core components.
   * Step 5 & 7: Creates definition with strict namespace enforcement (@mod_id:object_id).
   */
  static addItemDefinition(
    pkg: ModPackage,
    itemJson: ItemDefinitionJSON
  ): { success: boolean; error?: string } {
    const modId = pkg.manifest.mod_id;
    const expectedPrefix = `@${modId}:`;

    // Ensure proper namespace
    let finalId = itemJson.id;
    if (!finalId.startsWith(expectedPrefix)) {
      finalId = `${expectedPrefix}${finalId.replace(/^@?[^:]*:/, '')}`;
    }

    const definition: ItemDefinitionJSON = {
      ...itemJson,
      id: finalId,
    };

    if (!pkg.definitions.items) {
      pkg.definitions.items = [];
    }

    // Replace if exists, or append
    const idx = pkg.definitions.items.findIndex((i) => i.id === finalId);
    if (idx >= 0) {
      pkg.definitions.items[idx] = definition;
    } else {
      pkg.definitions.items.push(definition);
    }

    return { success: true };
  }

  /**
   * Adds an asset to the Mod using the mandatory `@mod_id/assets/...` namespace.
   * Step 6 & 7: Add asset & validate namespace.
   */
  static addAsset(
    pkg: ModPackage,
    relativePath: string,
    content: string
  ): { success: boolean; assetPath: string; error?: string } {
    const modId = pkg.manifest.mod_id;
    const cleanPath = relativePath.replace(/^@?[^/]*\/?assets\//, '').replace(/^\/+/, '');
    const fullAssetPath = `@${modId}/assets/${cleanPath}`;

    if (!pkg.assets) {
      pkg.assets = {};
    }

    pkg.assets[fullAssetPath] = content;

    return { success: true, assetPath: fullAssetPath };
  }

  /**
   * Step 8 & 9: Validates all references and compatibility before finalizing.
   */
  static validate(pkg: ModPackage): ModValidationReport {
    return ModValidator.validate(pkg);
  }

  /**
   * Step 10: Generates the final Mod files structure.
   * Returns:
   * - configFile: `${mod_id}.json`
   * - packageJson: Complete bundle with manifest, definitions, and assets
   */
  static export(pkg: ModPackage): {
    configFileName: string;
    configFileContent: string;
    packageFileName: string;
    packageFileContent: string;
  } {
    const modId = pkg.manifest.mod_id;
    const manifestOnly = {
      mod_id: pkg.manifest.mod_id,
      mod_version: pkg.manifest.mod_version,
      core_version: pkg.manifest.core_version,
      dependencias: pkg.manifest.dependencias,
    };

    return {
      configFileName: `${modId}.json`,
      configFileContent: JSON.stringify(manifestOnly, null, 2),
      packageFileName: `${modId}_bundle.json`,
      packageFileContent: JSON.stringify(pkg, null, 2),
    };
  }

  /**
   * Creates the official Copper Mod example matching the prompt specification.
   */
  static createCopperModExample(): ModPackage {
    const pkg = this.createModScaffold('copper_mod', {
      name: 'Copper Mod',
      description: 'Mod oficial de Cobre com Fornalha e Minério de Cobre',
      version: '0.0.1',
      coreVersion: '0.0.1',
      dependencies: [],
    });

    // 1. Add Asset
    this.addAsset(
      pkg,
      'blocks/copper_furnace.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <rect width="48" height="48" rx="8" fill="#b85d34" />
        <rect x="6" y="6" width="36" height="36" rx="4" fill="#8c4120" stroke="#d97745" stroke-width="2" />
        <circle cx="24" cy="24" r="10" fill="#f97316" />
        <circle cx="24" cy="24" r="6" fill="#fef08a" />
      </svg>`
    );

    // 2. Add Item: @copper_mod:copper_ore
    this.addItemDefinition(pkg, {
      id: '@copper_mod:copper_ore',
      nome: 'Minério de Cobre',
      categoria: 'material',
      components: [
        {
          id: 'identity',
          type: 'IdentityComponent',
          data: {
            displayName: 'Minério de Cobre',
            category: 'material',
            version: '1.0.0',
          },
        },
        {
          id: 'rarity',
          type: 'RarityComponent',
          data: {
            rarity: 'Comum',
          },
        },
        {
          id: 'stack',
          type: 'StackComponent',
          data: {
            maxStack: 64,
          },
        },
        {
          id: 'description',
          type: 'DescriptionComponent',
          data: {
            text: 'Minério bruto de cobre extraído de jazidas naturais.',
          },
        },
        {
          id: 'visual',
          type: 'VisualComponent',
          data: {
            icon: '🟧',
            color: '#b85d34',
          },
        },
      ],
    });

    // 3. Add Block: @copper_mod:copper_furnace
    this.addBlockDefinition(pkg, {
      id: '@copper_mod:copper_furnace',
      name: 'Fornalha de Cobre',
      category: 'workstations',
      tags: ['machine', 'furnace', 'interactive', 'solid'],
      components: [
        {
          id: 'solid',
          type: 'SolidComponent',
          data: {
            solid: true,
          },
        },
        {
          id: 'emoji',
          type: 'EmojiIconComponent',
          data: {
            emoji: '🔥',
          },
        },
        {
          id: 'color',
          type: 'ColorTextureComponent',
          data: {
            primaryColor: '#b85d34',
            secondaryColor: '#8c4120',
          },
        },
        {
          id: 'breakable',
          type: 'BreakableComponent',
          data: {
            hardness: 3.5,
            requiredTool: 'pickaxe',
            dropItemId: '@copper_mod:copper_ore',
          },
        },
        {
          id: 'light',
          type: 'LightComponent',
          data: {
            luminance: 12,
            color: '#f97316',
          },
        },
        {
          id: 'dynamic',
          type: 'DynamicBlockComponent',
          data: {
            ticksPerSecond: 1,
          },
        },
      ],
    });

    return pkg;
  }
}
