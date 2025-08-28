/**
 * DnD Kit provider component for drag and drop functionality
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent,
} from '@dnd-kit/core'
import { StoryCard } from './StoryCard'
import { usePlanningStore } from '@/stores/planning-store'
import {
  POSITION_MIN,
  POSITION_RANGE,
  type Position2D,
  type Story,
} from '@/types'
import { ANCHOR_POSITION, normalizePosition2D } from '@/utils'

interface DndProviderProps {
  children: React.ReactNode
}

export const DndProvider: React.FC<DndProviderProps> = ({ children }) => {
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [dragDelta, setDragDelta] = useState<Position2D>(ANCHOR_POSITION)
  const previousDragDelta = useRef<Position2D>(ANCHOR_POSITION)
  const initialActiveStoryPosition = useRef<Position2D>(ANCHOR_POSITION)

  const updateStoryPosition = usePlanningStore(
    state => state.updateStoryPosition
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  function setStoryPosition(story?: Story | null) {
    setActiveStory(story ?? null)
    previousDragDelta.current = story?.position ?? ANCHOR_POSITION
    initialActiveStoryPosition.current = story?.position ?? ANCHOR_POSITION
    setDragDelta(previousDragDelta.current)
  }

  function calculateNewPosition(delta: Position2D, position: Position2D) {
    const dndCanvas = document.getElementById('dnd-canvas')
    if (!dndCanvas) return position

    const dndCanvasRect = dndCanvas.getBoundingClientRect()

    const deltaX = (delta.x / dndCanvasRect.width) * POSITION_RANGE
    const deltaY = (delta.y / dndCanvasRect.height) * POSITION_RANGE

    return {
      x: position.x + deltaX,
      y: position.y + deltaY,
    }
  }

  function updateDragDelta(delta: Position2D) {
    setDragDelta({
      x: delta.x - previousDragDelta.current.x,
      y: delta.y - previousDragDelta.current.y,
    })
    previousDragDelta.current = delta
    setActiveStory(prev => {
      if (!prev) return null
      return {
        ...prev,
        position: calculateNewPosition(
          delta,
          initialActiveStoryPosition.current
        ),
      }
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const story = active.data.current?.story as Story

    if (!story) return
    setStoryPosition(story)
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event
    const story = active.data.current?.story as Story
    if (!activeStory) return
    if (!story) return
    if (story.isAnchor) return

    // Update the drag transform for the overlay (only for visual feedback)
    updateDragDelta(delta)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over events if needed for drop zones
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event
    const story = active.data.current?.story as Story
    if (!story) return

    updateStoryPosition(
      story.id,
      calculateNewPosition(event.delta, story.position)
    )
    setStoryPosition(null)
  }

  const handleDragCancel = () => {
    // Revert to original position if we have an active story and original position
    if (activeStory) {
      updateStoryPosition(activeStory.id, activeStory.position)
    }

    setStoryPosition(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>
        {activeStory && (
          <div
            className="transform scale-105 opacity-90"
            style={{
              transform: `rotate3d(${dragDelta.y * 10}, ${-dragDelta.x * 10}, 0, ${Math.min((Math.abs(dragDelta.x) + Math.abs(dragDelta.y)) * 5, 25)}deg)`,
            }}
          >
            <StoryCard
              story={{
                ...activeStory,
                position: {
                  x: activeStory.position.x + dragDelta.x,
                  y: activeStory.position.y + dragDelta.y,
                },
              }}
              className="shadow-2xl border-primary/50 bg-background/95 backdrop-blur-sm"
              enableDrag={false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

DndProvider.displayName = 'DndProvider'
