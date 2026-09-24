import React from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { ComponentEditor, ComponentSerializedItem } from './ComponentEditor';
import { ComponentSelector, GenericComponentSchema } from './ComponentSelector';

export interface ComponentListProps {
  components: ComponentSerializedItem[];
  schemas: GenericComponentSchema[];
  onUpdateComponent: (index: number, updated: ComponentSerializedItem) => void;
  onRemoveComponent: (index: number) => void;
  onAddComponent: (schema: GenericComponentSchema) => void;
  onDuplicateComponent?: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  buttonLabel?: string;
  selectorTitle?: string;
  emptyMessage?: string;
}

export const ComponentList: React.FC<ComponentListProps> = ({
  components,
  schemas,
  onUpdateComponent,
  onRemoveComponent,
  onAddComponent,
  onDuplicateComponent,
  onMoveUp,
  onMoveDown,
  buttonLabel = '+ Adicionar Componente',
  selectorTitle = 'Adicionar Componente',
  emptyMessage = 'Nenhum componente anexado ainda. Clique abaixo para adicionar.',
}) => {
  const schemaMap = React.useMemo(() => {
    const map = new Map<string, GenericComponentSchema>();
    for (const s of schemas) {
      map.set(s.type, s);
      map.set(s.type.toLowerCase(), s);
    }
    return map;
  }, [schemas]);

  const presentTypes = React.useMemo(() => {
    return new Set(components.map((c) => c.type));
  }, [components]);

  return (
    <div className="flex flex-col space-y-3.5">
      {/* List of active components */}
      {components.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center flex flex-col items-center justify-center space-y-2">
          <Layers className="w-8 h-8 text-zinc-600 animate-pulse" />
          <p className="text-xs text-zinc-500 max-w-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {components.map((comp, index) => {
            const schema =
              schemaMap.get(comp.type) ||
              schemaMap.get(comp.type.toLowerCase());
            return (
              <ComponentEditor
                key={comp.id || `${comp.type}_${index}`}
                component={comp}
                schema={schema}
                index={index}
                total={components.length}
                allComponents={components}
                onUpdate={(updated) => onUpdateComponent(index, updated)}
                onRemove={() => onRemoveComponent(index)}
                onDuplicate={
                  onDuplicateComponent
                    ? () => onDuplicateComponent(index)
                    : undefined
                }
                onMoveUp={onMoveUp ? () => onMoveUp(index) : undefined}
                onMoveDown={onMoveDown ? () => onMoveDown(index) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Component Selector Trigger */}
      <div className="pt-1">
        <ComponentSelector
          schemas={schemas}
          presentTypes={presentTypes}
          onSelectComponent={onAddComponent}
          buttonLabel={buttonLabel}
          title={selectorTitle}
        />
      </div>
    </div>
  );
};
