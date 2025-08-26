/**
 * PlanningCanvas component for story positioning and drag-and-drop functionality
 */

'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { StoryCard } from './StoryCard'
import { usePlanningStore } from '@/stores/planning-store'
import { useDialogStore } from '@/stores/dialog-store'
import { cn } from '@/lib/utils'
import type { Story } from '@/types'

export interface PlanningCanvasProps {
  className?: string
  onStoryDoubleClick?: (story: Story) => void
}

export const PlanningCanvas: React.FC<PlanningCanvasProps> = ({
  className,
  onStoryDoubleClick,
}) => {
  const currentSession = usePlanningStore(state => state.currentSession)
  const canvasRef = React.useRef<HTMLDivElement>(null)

  // Set up droppable area for the entire canvas
  const { setNodeRef, isOver } = useDroppable({
    id: 'planning-canvas',
    data: {
      type: 'canvas',
    },
  })

  // Combine refs for both droppable and canvas measurements
  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node)
      if (canvasRef.current !== node) {
        canvasRef.current = node
      }
    },
    [setNodeRef]
  )

  if (!currentSession) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-muted-foreground">No active planning session</p>
      </div>
    )
  }

  // Get store actions only when we have a session
  const { setAnchorStory, deleteStory } = usePlanningStore()
  const { openEditStoryDialog } = useDialogStore()

  const handleEditStory = (story: Story) => {
    openEditStoryDialog(story)
  }

  const handleDeleteStory = (story: Story) => {
    try {
      deleteStory(story.id)
    } catch (error) {
      console.error('Failed to delete story:', error)
      // You could add toast notification here
    }
  }

  const handleMakeAnchor = (story: Story) => {
    try {
      setAnchorStory(story.id)
    } catch (error) {
      console.error('Failed to set anchor story:', error)
      // You could add toast notification here
    }
  }

  const { stories } = currentSession

  if (stories.length === 0) {
    return (
      <div
        ref={combinedRef}
        className={cn(
          'relative min-h-[300px] flex items-center justify-center',
          'border-2 border-dashed border-muted-foreground/20 rounded-lg',
          'transition-colors duration-200',
          isOver && 'border-primary/50 bg-primary/5',
          className
        )}
      >
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No stories to display</p>
          <p className="text-sm text-muted-foreground/70">
            Add your first story to start planning
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Horizontal Axis Visualization */}
      <div className="relative px-4">
        <div className="relative h-8 flex items-center">
          {/* Main axis line */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-border -translate-y-1/2" />

          {/* Complexity indicators */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="h-3 w-px bg-green-500" />
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs text-green-600 font-medium">Lower</span>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-6 w-px bg-primary" />
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs text-primary font-medium">Anchor</span>
            </div>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="h-3 w-px bg-orange-500" />
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs text-orange-600 font-medium">
                Higher
              </span>
            </div>
          </div>
        </div>

        {/* Complexity labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-8">
          <span>Lower Complexity</span>
          <span className="text-primary font-medium">Reference Point</span>
          <span>Higher Complexity</span>
        </div>
      </div>

      {/* Story Positioning Area */}
      <div
        ref={combinedRef}
        className={cn(
          'relative min-h-[400px] w-full px-4',
          'transition-colors duration-200',
          isOver && 'bg-primary/5 rounded-lg',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2'
        )}
        role="application"
        aria-label="Story positioning canvas"
        tabIndex={-1}
      >
        {/* Grid lines for visual reference (subtle) */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          {Array.from({ length: 9 }, (_, i) => {
            const position = (i + 1) * 10 // 10%, 20%, ..., 90%
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-muted-foreground/10"
                style={{ left: `${position}%` }}
              />
            )
          })}
        </div>

        {/* Stories positioned along the horizontal axis */}
        {stories.map((story, index) => {
          // Convert position (-100 to 100) to percentage (0% to 100%)
          const leftPercentage = ((story.position + 100) / 200) * 100

          // Handle story stacking when positions are close
          const closeStories = stories.filter(
            s => Math.abs(s.position - story.position) < 10 && s.id !== story.id
          )
          const stackIndex = closeStories.filter(
            s => stories.findIndex(st => st.id === s.id) < index
          ).length

          return (
            <div
              key={story.id}
              className="absolute transition-all duration-300 ease-out"
              style={{
                left: `${Math.max(5, Math.min(95, leftPercentage))}%`,
                top: `${20 + stackIndex * 120}px`, // Stack vertically when close
                transform: 'translateX(-50%)',
                zIndex: story.isAnchor ? 10 : 1 + stackIndex,
              }}
            >
              <StoryCard
                story={story}
                onDoubleClick={() => onStoryDoubleClick?.(story)}
                onEdit={() => handleEditStory(story)}
                onDelete={() => handleDeleteStory(story)}
                onMakeAnchor={() => handleMakeAnchor(story)}
                className={cn(
                  'transition-transform duration-200',
                  stackIndex > 0 && 'scale-95 opacity-90'
                )}
              />
            </div>
          )
        })}

        {/* Drop zone indicator when dragging */}
        {isOver && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-primary/30 rounded-full animate-pulse" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Drop to position story
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Position Summary */}
      {stories.length > 0 && (
        <div className="px-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">
              Story Positions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {stories
                .slice()
                .sort((a, b) => a.position - b.position)
                .map(story => (
                  <div
                    key={story.id}
                    className={cn(
                      'flex justify-between items-center p-2 rounded border',
                      story.isAnchor && 'bg-primary/10 border-primary/20'
                    )}
                  >
                    <span
                      className={cn(
                        'truncate flex-1 mr-2',
                        story.isAnchor && 'font-medium text-primary'
                      )}
                    >
                      {story.title}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {story.position > 0 ? '+' : ''}
                      {story.position}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

PlanningCanvas.displayName = 'PlanningCanvas'
