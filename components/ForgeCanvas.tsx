'use client';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { motion } from 'framer-motion';

type Leg = { id: string; label: string; odds: number };

export default function ForgeCanvas() {
  const [legs, setLegs] = useState<Leg[]>([]);
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const onDragEnd = (e: any) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = legs.findIndex((l) => l.id === active.id);
    const newIndex = legs.findIndex((l) => l.id === over.id);
    setLegs(arrayMove(legs, oldIndex, newIndex));
  };
  const payout = legs.reduce(
    (acc, l) => acc * (l.odds >= 100 ? 1 + l.odds / 100 : 1 + 100 / Math.abs(l.odds)),
    1
  );
  return (
    <div className="grid md:grid-cols-[2fr_1fr] gap-4">
      <div className="card p-3">
        <h3 className="font-medium mb-2">Parlay Chain</h3>
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={legs.map((l) => l.id)} strategy={rectSortingStrategy}>
            <ul className="space-y-2">
              {legs.map((l) => (
                <li key={l.id} className="rounded border border-neutral-700 p-2 bg-black/30">
                  {l.label}{' '}
                  <span className="text-xs text-neutral-400">
                    ({l.odds > 0 ? '+' : ''}
                    {l.odds})
                  </span>
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      <div className="card p-3">
        <h3 className="font-medium">Heat Gauge</h3>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="mt-3 rounded p-4 bg-black/40"
        >
          Multiplier ≈ <b>{payout.toFixed(2)}x</b>
        </motion.div>
        <button className="btn-carbon mt-4 px-3 py-2 rounded">Sandbox It (Daytona)</button>
      </div>
    </div>
  );
}
