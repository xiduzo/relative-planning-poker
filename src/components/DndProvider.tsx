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
import { normalizePosition2D } from '@/utils'

interface DndProviderProps {
  children: React.ReactNode
}

export const DndProvider: React.FC<DndProviderProps> = ({ children }) => {
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [dragTransform, setDragTransform] = useState<Position2D>({ x: 0, y: 0 })

  const updateStoryPosition = usePlanningStore(
    state => state.updateStoryPosition
  )
  const deleteStory = usePlanningStore(state => state.deleteStory)
  const currentSession = usePlanningStore(state => state.currentSession)

  function adjustPosition(event: KeyboardEvent, story: Story) {
    if (story.isAnchor) return

    const POSITION_CHANGE = event.shiftKey ? 10 : 2

    let newX = story.position.x
    let newY = story.position.y

    switch (event.key) {
      case 'ArrowRight':
        newX += POSITION_CHANGE
        break
      case 'ArrowLeft':
        newX -= POSITION_CHANGE
        break
      case 'ArrowDown':
        newY += POSITION_CHANGE
        break
      case 'ArrowUp':
        newY -= POSITION_CHANGE
        break
    }

    const newPosition = normalizePosition2D({ x: newX, y: newY })
    updateStoryPosition(story.id, newPosition)
  }

  // Handle keyboard navigation for focused story cards
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isActionKey = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Backspace',
      ].includes(event.key)
      if (!isActionKey) return

      const focusedElement = document.activeElement
      if (!focusedElement?.hasAttribute('data-story-id')) return

      event.preventDefault()

      // Get the story ID from the focused element
      const storyId = focusedElement.getAttribute('data-story-id')
      if (!storyId || !currentSession?.stories) return

      const story = currentSession.stories.find(s => s.id === storyId)
      if (!story) return

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowLeft':
        case 'ArrowDown':
        case 'ArrowUp':
          adjustPosition(event, story)
          break
        case 'Backspace':
          deleteStory(storyId)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentSession, updateStoryPosition, deleteStory])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const story = active.data.current?.story as Story

    if (!story) return
    setActiveStory(story)
    setDragTransform({ x: 0, y: 0 }) // Reset transform
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event
    const story = active.data.current?.story as Story
    if (!activeStory) return
    if (!story) return
    if (story.isAnchor) return

    // Update the drag transform for the overlay (only for visual feedback)
    setDragTransform({
      x: delta.x,
      y: delta.y,
    })
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over events if needed for drop zones
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event
    const story = active.data.current?.story as Story
    if (!story) return

    const dndCanvas = document.getElementById('dnd-canvas')
    if (!dndCanvas) return

    const dndCanvasRect = dndCanvas.getBoundingClientRect()

    const { delta } = event

    const deltaX = (delta.x / dndCanvasRect.width) * POSITION_RANGE
    const deltaY = (delta.y / dndCanvasRect.height) * POSITION_RANGE

    // Calculate new position by adding delta to current position
    const newPosition = {
      x: story.position.x + deltaX,
      y: story.position.y + deltaY,
    }

    updateStoryPosition(story.id, newPosition)

    setActiveStory(null)
    setDragTransform({ x: 0, y: 0 })
  }

  const handleDragCancel = () => {
    // Revert to original position if we have an active story and original position
    if (activeStory) {
      updateStoryPosition(activeStory.id, activeStory.position)
    }

    setActiveStory(null)
    setDragTransform({ x: 0, y: 0 })
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
              // TODO: rotate3d based on the origin of the story card and the drag transform
              transform: `rotate(${Math.sign(dragTransform.x) * 3}deg)`,
            }}
          >
            <StoryCard
              story={activeStory}
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
