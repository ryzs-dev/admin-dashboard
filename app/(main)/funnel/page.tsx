'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

import { DndContext, closestCenter } from '@dnd-kit/core';

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState('funnel');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">CRM Automation</h1>

      <div className="flex gap-3">
        <Button
          onClick={() => setActiveTab('funnel')}
          variant={activeTab === 'funnel' ? 'default' : 'outline'}
        >
          Funnel System
        </Button>
        <Button
          onClick={() => setActiveTab('automation')}
          variant={activeTab === 'automation' ? 'default' : 'outline'}
        >
          Follow-Up Automation
        </Button>
      </div>

      <div>
        {activeTab === 'funnel' && <FunnelUI />}
        {activeTab === 'automation' && <AutomationUI />}
      </div>
    </div>
  );
}

function FunnelUI() {
  const stages = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Won'];

  return (
    <div className="grid grid-cols-5 gap-4">
      {stages.map((stage, i) => (
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="rounded-2xl shadow">
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold">{stage}</h2>

              {[1, 2].map((lead) => (
                <div key={lead} className="p-2 rounded-xl bg-gray-100 text-sm">
                  Lead #{i + 1}-{lead}
                </div>
              ))}

              <Button size="sm" variant="outline" className="w-full">
                + Add Lead
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function AutomationUI() {
  const [steps, setSteps] = useState([
    { id: '1', type: 'message', content: 'Hi! Here’s more info 😊' },
    { id: '2', type: 'wait', delay: '2 days' },
    { id: '3', type: 'message', content: 'Just checking in 👋' },
  ]);

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      setSteps(arrayMove(steps, oldIndex, newIndex));
    }
  }

  function updateStep(id: string, field: string, value: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function deleteStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function insertStep(index: number, type: string) {
    const newStep =
      type === 'message'
        ? { id: Date.now().toString(), type: 'message', content: 'New message' }
        : { id: Date.now().toString(), type: 'wait', delay: '1 day' };

    const newSteps = [...steps];
    newSteps.splice(index, 0, newStep);
    setSteps(newSteps);
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="space-y-4">
        <h2 className="font-semibold">Automations</h2>

        <Card className="rounded-2xl shadow">
          <CardContent className="p-4">
            <p className="font-medium">Info Follow-Up</p>
            <p className="text-sm text-gray-500">Trigger: Clicked Get Info</p>
            <p className="text-xs mt-2">Steps: {steps.length}</p>
          </CardContent>
        </Card>

        <Button className="w-full">+ New Automation</Button>
      </div>

      <div className="col-span-2 space-y-4">
        <h2 className="font-semibold">Automation Builder</h2>

        <Card className="rounded-2xl shadow">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Trigger</p>
            <p className="font-medium">User clicked \"Get Info\"</p>
          </CardContent>
        </Card>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="space-y-2">
                  {/* Insert BEFORE */}
                  <InsertBar onAdd={(type: string) => insertStep(index, type)} />

                  <SortableItem
                    id={step.id}
                    step={step}
                    onChange={updateStep}
                    onDelete={deleteStep}
                  />
                </div>
              ))}

              {/* Insert at END */}
              <InsertBar onAdd={(type: string) => insertStep(steps.length, type)} />
            </div>
          </SortableContext>
        </DndContext>

        <Button className="w-full">Save Automation</Button>
      </div>
    </div>
  );
}

function InsertBar({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <div className="flex gap-2 justify-center">
      <Button size="sm" variant="outline" onClick={() => onAdd('message')}>
        + Message
      </Button>
      <Button size="sm" variant="outline" onClick={() => onAdd('wait')}>
        + Wait
      </Button>
    </div>
  );
}

function SortableItem({ id, step, onChange, onDelete }: { id: string, step: { id: string, type: string, content?: string, delay?: string }, onChange: (id: string, field: string, value: string) => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="rounded-2xl shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab text-xs text-gray-400"
            >
              ⠿ Drag
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(id)}
            >
              Delete
            </Button>
          </div>

          {step.type === 'message' ? (
            <>
              <p className="text-sm text-gray-500">Message</p>
              <Input
                value={step.content}
                onChange={(e) => onChange(id, 'content', e.target.value)}
              />
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">Wait</p>
              <Input
                value={step.delay}
                onChange={(e) => onChange(id, 'delay', e.target.value)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
