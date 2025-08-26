/**
 * DnD Kit provider component for drag and drop functionality
 */

'use client';

import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent,
} from '@dnd-kit/core';
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { StoryCard } from './StoryCard';
import { usePlanningStore } from '@/stores/planning-store';
import type { Story } from '@/types';

interface DndProviderProps {
  children: React.ReactNode;
}

export const DndProvider: React.FC<DndProviderProps> = ({ children }) => {
  const [activeStory, setActiveStory] = React.useState<Story | null>(null);
  const updateStoryPosition = usePlanningStore((state) => state.updateStoryPosition);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        // Custom keyboard navigation for horizontal-only movement
        if (event.code === 'ArrowLeft') {
          return { x: -20, y: 0 };
        }
        if (event.code === 'ArrowRight') {
          return { x: 20, y: 0 };
        }
        return { x: 0, y: 0 };
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const story = active.data.current?.story as Story;
    
    if (story) {
      setActiveStory(story);
    }
  };

  const handleDragMove = (_event: DragMoveEvent) => {
    // Optional: Add real-time position feedback during drag
    // This could be used for visual indicators or live position updates
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over events if needed for drop zones
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const story = active.data.current?.story as Story;

    if (story && delta.x !== 0) {
      // Calculate new position based on drag delta
      // Convert pixel movement to position scale (-100 to 100)
      const positionDelta = (delta.x / 400) * 100; // 400px = full range
      const newPosition = Math.max(-100, Math.min(100, story.position + positionDelta));
      
      // Snap to nearest 5-unit increment for cleaner positioning
      const snappedPosition = Math.round(newPosition / 5) * 5;
      
      updateStoryPosition(story.id, snappedPosition);
    }

    setActiveStory(null);
  };

  const handleDragCancel = () => {
    setActiveStory(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
    >
      {children}
      
      <DragOverlay>
        {activeStory ? (
          <div className="transform rotate-3 scale-105 opacity-90">
            <StoryCard 
              story={activeStory} 
              className="shadow-2xl border-primary/50 bg-background/95 backdrop-blur-sm"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

DndProvider.displayName = 'DndProvider';