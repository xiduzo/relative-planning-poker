/**
 * DnD Kit provider component for drag and drop functionality
 */

'use client'

import React from 'react'
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
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { StoryCard } from './StoryCard'
import { usePlanningStore } from '@/stores/planning-store'
import type { Story } from '@/types'

// Context for sharing canvas ref
const CanvasContext = React.createContext<
  React.RefObject<HTMLDivElement | null>
>(React.createRef())

export const useCanvasRef = () => {
  const context = React.useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvasRef must be used within DndProvider')
  }
  return context
}

interface DndProviderProps {
  children: React.ReactNode
}

export const DndProvider: React.FC<DndProviderProps> = ({ children }) => {
  const [activeStory, setActiveStory] = React.useState<Story | null>(null)
  const [dragTransform, setDragTransform] = React.useState<{
    x: number
    y: number
  } | null>(null)
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const updateStoryPosition = usePlanningStore(
    state => state.updateStoryPosition
  )
  const currentSession = usePlanningStore(state => state.currentSession)

  // Handle keyboard navigation for focused story cards
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys
      if (
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        return
      }

      // Check if the focused element is a story card
      const focusedElement = document.activeElement
      if (!focusedElement || !focusedElement.hasAttribute('data-story-id')) {
        return
      }

      event.preventDefault()

      // Get the story ID from the focused element
      const storyId = focusedElement.getAttribute('data-story-id')
      if (!storyId || !currentSession || !currentSession.stories) {
        return
      }

      // Find the story in the current session
      const story = currentSession.stories.find(s => s.id === storyId)
      if (!story) {
        return
      }

      // Don't allow moving anchor stories
      if (story.isAnchor) {
        return
      }

      // Calculate position change (same increment as drag snapping)
      const positionChange = 5
      let newX = story.position.x
      let newY = story.position.y

      switch (event.key) {
        case 'ArrowRight':
          newX += positionChange
          break
        case 'ArrowLeft':
          newX -= positionChange
          break
        case 'ArrowDown':
          newY += positionChange
          break
        case 'ArrowUp':
          newY -= positionChange
          break
      }

      const newPosition = {
        x: Math.max(-100, Math.min(100, newX)),
        y: Math.max(-100, Math.min(100, newY)),
      }

      updateStoryPosition(storyId, newPosition)
    }

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentSession, updateStoryPosition])

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const story = active.data.current?.story as Story

    if (story) {
      setActiveStory(story)
      setDragTransform(null) // Reset transform
    }
  }

  const handleDragMove = (event: DragMoveEvent) => {
    // Update the drag transform for the overlay
    if (event.delta) {
      setDragTransform({
        x: event.delta.x,
        y: event.delta.y,
      })
    }
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over events if needed for drop zones
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    const story = active.data.current?.story as Story

    if (story && (delta.x !== 0 || delta.y !== 0)) {
      // Don't allow moving anchor stories
      if (story.isAnchor) {
        setActiveStory(null)
        setDragTransform(null)
        return
      }

      // Get canvas dimensions for position calculation
      const canvas = canvasRef.current
      if (!canvas) {
        setActiveStory(null)
        setDragTransform(null)
        return
      }

      const canvasRect = canvas.getBoundingClientRect()

      // Calculate new position based on drag delta
      // Convert pixel movement to position scale (-100 to 100)
      const positionDeltaX = (delta.x / canvasRect.width) * 200
      const positionDeltaY = (delta.y / canvasRect.height) * 200

      const newPosition = {
        x: Math.max(-100, Math.min(100, story.position.x + positionDeltaX)),
        y: Math.max(-100, Math.min(100, story.position.y + positionDeltaY)),
      }

      // Snap to nearest 5-unit increment for cleaner positioning
      const snappedPosition = {
        x: Math.round(newPosition.x / 5) * 5,
        y: Math.round(newPosition.y / 5) * 5,
      }

      updateStoryPosition(story.id, snappedPosition)
    }

    setActiveStory(null)
    setDragTransform(null)
  }

  const handleDragCancel = () => {
    setActiveStory(null)
    setDragTransform(null)
  }

  return (
    <CanvasContext.Provider value={canvasRef}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToParentElement]}
      >
        {children}

        <DragOverlay>
          {activeStory ? (
            <div
              className="transform scale-105 opacity-90"
              style={
                dragTransform
                  ? {
                      // Rotate based on drag direction: positive x = lean right, negative x = lean left
                      transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0) rotate(${Math.sign(dragTransform.x) * 3}deg) scale(1.05)`,
                    }
                  : {
                      transform: 'rotate(3deg) scale(1.05)', // Default rotation when not dragging
                    }
              }
            >
              <StoryCard
                story={activeStory}
                className="shadow-2xl border-primary/50 bg-background/95 backdrop-blur-sm"
                enableDrag={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </CanvasContext.Provider>
  )
}

DndProvider.displayName = 'DndProvider'
