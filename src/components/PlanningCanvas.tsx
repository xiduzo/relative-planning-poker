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
import { positionToPercentage } from '@/utils/position'
import { useCanvasRef } from './DndProvider'
import { Button } from './ui/button'
import { AnchorIcon, Plus } from 'lucide-react'
import type { Story } from '@/types'
import { Badge } from './ui/badge'

export interface PlanningCanvasProps {
  className?: string
  onStoryDoubleClick?: (story: Story) => void
}

export const PlanningCanvas: React.FC<PlanningCanvasProps> = ({
  className,
  onStoryDoubleClick,
}) => {
  const currentSession = usePlanningStore(state => state.currentSession)
  const canvasRef = useCanvasRef()

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
      if (node && canvasRef.current !== node) {
        canvasRef.current = node
      }
    },
    [setNodeRef, canvasRef]
  )

  // Get store actions
  const { setAnchorStory, deleteStory } = usePlanningStore()
  const { openEditStoryDialog } = useDialogStore()

  if (!currentSession) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-muted-foreground">No active planning session</p>
      </div>
    )
  }

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
  const { openAddStoryDialog } = useDialogStore()

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_4rem] grid-rows-[2rem_1fr] gap-0 flex-1 min-h-0',
        className
      )}
    >
      {/* Complexity indicators */}
      <section className="col-span-1 row-span-1 relative h-8 flex items-center px-4">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border -translate-y-1/2" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <div className="h-3 w-px bg-muted-foreground" />
          <div className="absolute bottom-full left-1/2 whitespace-nowrap">
            <span className="text-xs text-muted-foreground font-medium">
              Low complexity
            </span>
          </div>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <div className="h-3 w-px bg-muted-foreground" />
          <div className="absolute bottom-full right-1/2 whitespace-nowrap">
            <span className="text-xs text-muted-foreground font-medium">
              High complexity
            </span>
          </div>
        </div>
      </section>

      {/* Main canvas area, offset by 1 column */}
      <section
        ref={combinedRef}
        className={cn(
          'relative px-4 col-span-1 col-start-1 row-span-1 h-full',
          'transition-colors duration-200',
          isOver && 'bg-primary/5 rounded-lg'
        )}
        role="application"
        aria-label="Story positioning canvas"
        tabIndex={-1}
      >
        {/* Grid lines for visual reference */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {/* Vertical grid lines (complexity) */}
          {Array.from({ length: 9 }, (_, i) => {
            const position = (i + 1) * 10 // 10%, 20%, ..., 90%
            return (
              <div
                key={`v-${i}`}
                className="absolute top-0 bottom-0 w-px bg-muted-foreground/20"
                style={{ left: `${position}%` }}
              />
            )
          })}

          {/* Horizontal grid lines (uncertainty) */}
          {Array.from({ length: 9 }, (_, i) => {
            const position = (i + 1) * 10 // 10%, 20%, ..., 90%
            return (
              <div
                key={`h-${i}`}
                className="absolute left-0 right-0 h-px bg-muted-foreground/20"
                style={{ top: `${position}%` }}
              />
            )
          })}

          {/* Center cross */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/40" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/40" />
          </div>
        </div>

        {/* Stories positioned in 2D space */}
        {stories.map(story => {
          const percentagePosition = positionToPercentage(story.position)

          return (
            <div
              key={story.id}
              className="absolute"
              style={{
                left: percentagePosition.left,
                top: percentagePosition.top,
                transform: 'translate(-50%, -50%)',
                zIndex: story.isAnchor ? 10 : 1,
                // Disable transitions for immediate positioning during drag
                transition: 'none',
              }}
            >
              <StoryCard
                story={story}
                onDoubleClick={() => onStoryDoubleClick?.(story)}
                onEdit={() => handleEditStory(story)}
                onDelete={() => handleDeleteStory(story)}
                onMakeAnchor={() => handleMakeAnchor(story)}
                className="transition-transform duration-200"
              />
            </div>
          )
        })}

        {/* Empty state with centered button when no stories */}
        {stories.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground font-medium">
                  No stories to display
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Add your first anchor story to start planning
                </p>
              </div>
              <Button
                onClick={openAddStoryDialog}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <Plus className="h-5 w-5" />
                Add Anchor Story
              </Button>
            </div>
          </div>
        )}

        {/* Drop zone indicator when dragging */}
        {isOver && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-dashed border-primary/30 rounded-lg animate-pulse" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Badge>Drop to position story</Badge>
            </div>
          </div>
        )}
      </section>

      {/* Right-side Uncertainty Axis */}
      <section className="col-span-1 row-span-1 relative flex items-center h-full min-h-0">
        {/* Y-axis line (Uncertainty) */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-border -translate-x-1/2" />

        {/* Uncertainty indicators */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <div className="w-3 h-px bg-muted-foreground" />
          <div className="absolute top-fullleft-0 whitespace-nowrap transform rotate-90 origin-left translate-x-6 -translate-y-3">
            <span className="text-xs text-muted-foreground font-medium">
              A lot of uncertainty
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <div className="w-3 h-px bg-muted-foreground" />
          <div className="absolute bottom-full right-0 whitespace-nowrap transform rotate-90 origin-right translate-x-3 translate-y-3">
            <span className="text-xs text-muted-foreground font-medium">
              No uncertainty
            </span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="col-span-1 row-span-1 relative flex items-center h-full min-h-0">
        <Button variant="outline" onClick={openAddStoryDialog}>
          <Plus className="h-5 w-5" />
          Add new Story
        </Button>
      </section>
    </div>
  )
}

PlanningCanvas.displayName = 'PlanningCanvas'
