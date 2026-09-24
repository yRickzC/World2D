import { Activity, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { globalItemEventBus } from '../../../gameplay/ItemSystem/ItemManager';
import { ItemEventPayload } from '../../../gameplay/ItemSystem/types';

export const EventViewer: React.FC = () => {
  const [events, setEvents] = useState<ItemEventPayload[]>([]);

  useEffect(() => {
    // Listen to generic item events
    const eventNames = [
      'item.created',
      'item.destroyed',
      'item.updated',
      'item.loop',
      'item.used',
      'item.consumed',
      'item.dropped',
      'item.picked_up',
      'item.equipped',
      'item.unequipped',
      'item.render',
      'item.rendered',
      'item.component_created',
      'item.component_destroyed',
    ];

    const unsubs = eventNames.map((name) =>
      globalItemEventBus.on(name, (payload) => {
        setEvents((prev) => [payload, ...prev.slice(0, 99)]);
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex items-center justify-between bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white">Event Bus Monitor (Tempo Real)</h3>
          <span className="text-[10px] text-zinc-500 font-mono">
            {events.length} evento(s) capturados
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEvents([])}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Limpar Logs</span>
        </button>
      </div>

      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 overflow-y-auto font-mono text-xs space-y-1.5">
        {events.length === 0 ? (
          <div className="text-zinc-600 italic text-center p-8">
            Nenhum evento registrado no ItemEventBus até o momento. Use itens no jogo para emitir eventos.
          </div>
        ) : (
          events.map((ev, idx) => (
            <div
              key={idx}
              className="p-2 bg-zinc-900/60 border border-zinc-850 rounded-lg flex items-center justify-between gap-3 text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                <span className="text-amber-400 font-bold">{ev.itemId}</span>
                {ev.componentType && (
                  <span className="text-cyan-400">[{ev.componentType}]</span>
                )}
                {ev.data && (
                  <span className="text-zinc-400 truncate max-w-md">
                    {JSON.stringify(ev.data)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                inst: {ev.instanceId ? ev.instanceId.slice(0, 12) : 'none'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
