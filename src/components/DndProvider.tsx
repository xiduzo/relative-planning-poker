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
import type { Position2D, Story } from '@/types'

interface DndProviderProps {
  children: React.ReactNode
}

export const DndProvider: React.FC<DndProviderProps> = ({ children }) => {
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [dragTransform, setDragTransform] = useState<Position2D>({ x: 0, y: 0 })

  const updateStoryPosition = usePlanningStore(
    state => state.updateStoryPosition
  )
  const currentSession = usePlanningStore(state => state.currentSession)

  // Handle keyboard navigation for focused story cards
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isActionKey = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
      ].includes(event.key)
      if (!isActionKey) return

      const focusedElement = document.activeElement
      if (!focusedElement?.hasAttribute('data-story-id')) return

      event.preventDefault()

      // Get the story ID from the focused element
      const storyId = focusedElement.getAttribute('data-story-id')
      if (!storyId || !currentSession || !currentSession.stories) return

      const story = currentSession.stories.find(s => s.id === storyId)
      if (!story) return

      if (story.isAnchor) return

      // Calculate position change for keyboard navigation
      const positionChange = 2 // Fixed increment for keyboard movement
      const modifier = event.shiftKey ? 10 : 1
      let newX = story.position.x
      let newY = story.position.y

      switch (event.key) {
        case 'ArrowRight':
          newX += positionChange * modifier
          break
        case 'ArrowLeft':
          newX -= positionChange * modifier
          break
        case 'ArrowDown':
          newY += positionChange * modifier
          break
        case 'ArrowUp':
          newY -= positionChange * modifier
          break
      }

      const newPosition = {
        x: Math.max(-100, Math.min(100, newX)),
        y: Math.max(-100, Math.min(100, newY)),
      }

      updateStoryPosition(storyId, newPosition)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentSession, updateStoryPosition])

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
    console.log('finalPosition', event, story.position, event.delta)
    console.log('dndCanvasRect', dndCanvasRect)

    // Translate delta based on the canvas rect to a Position2D that the story needs
    const deltaX = (delta.x / dndCanvasRect.width) * 200 // Convert to -100 to 100 range
    const deltaY = (delta.y / dndCanvasRect.height) * 200 // Convert to -100 to 100 range

    // Calculate new position by adding delta to current position
    const newPosition = {
      x: story.position.x + deltaX,
      y: story.position.y + deltaY,
    }

    console.log('newPosition', newPosition)
    // Update the story position
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
