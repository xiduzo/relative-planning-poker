/**
 * PlanningCanvas component for story positioning and drag-and-drop functionality
 */

'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { StoryCard } from './StoryCard'
import {
  useUpdateStoryPosition,
  useSetAnchorStory,
  useDeleteStory,
} from '@/hooks/use-session'
import { cn } from '@/lib/utils'
import { normalizePosition2D, positionToPercentage } from '@/utils/position'
import { Button } from './ui/button'
import { SparkleIcon } from 'lucide-react'
import type { Story } from '@/types'
import { toast } from 'sonner'
import { getErrorMessage } from '@/utils/validation'
import { useDialogStore } from '@/stores/dialog-store'
import { usePlanningStore } from '@/stores/planning-store'

export interface PlanningCanvasProps {
  className?: string
  onStoryDoubleClick?: (story: Story) => void
}

export const PlanningCanvas: React.FC<PlanningCanvasProps> = ({
  className,
  onStoryDoubleClick,
}) => {
  const currentSession = usePlanningStore(state => state.currentSession)
  const updateStoryPositionMutation = useUpdateStoryPosition()
  const setAnchorStoryMutation = useSetAnchorStory()
  const deleteStoryMutation = useDeleteStory()
  const isEstimateMode = currentSession?.anchorStoryPoints ?? false

  // Set up droppable area for the entire canvas
  const { setNodeRef, isOver } = useDroppable({
    id: 'planning-canvas',
    data: {
      type: 'canvas',
    },
  })

  // Get store actions
  const { openEditStoryDialog, openAddStoryDialog } = useDialogStore()

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

  const handleDeleteStory = async (story: Story) => {
    try {
      await deleteStoryMutation.mutateAsync(story.id)
    } catch (error) {
      toast.error('Failed to delete story', {
        description: getErrorMessage(error),
      })
    }
  }

  const handleMakeAnchor = async (story: Story) => {
    if (!currentSession) return

    try {
      await setAnchorStoryMutation.mutateAsync({
        sessionId: currentSession.id,
        storyId: story.id,
      })
    } catch (error) {
      toast.error('Failed to set beacon story', {
        description: getErrorMessage(error),
      })
    }
  }

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
    updateStoryPositionMutation.mutate({
      storyId: story.id,
      position: newPosition,
    })
  }

  function handleStoryKey(event: KeyboardEvent, story: Story) {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'ArrowDown':
        adjustPosition(event, story)
        break
      case 'Backspace':
        handleDeleteStory(story)
        break
    }
  }

  const { stories } = currentSession

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_2.5rem] grid-rows-[2rem_1fr] gap-0 flex-1 min-h-0',
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
              Lower complexity
            </span>
          </div>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <div className="h-3 w-px bg-muted-foreground" />
          <div className="absolute bottom-full right-1/2 whitespace-nowrap">
            <span className="text-xs text-muted-foreground font-medium">
              Higher complexity
            </span>
          </div>
        </div>
      </section>

      {/* Main canvas area, offset by 1 column */}
      <section
        ref={setNodeRef}
        className={cn(
          'relative px-4 col-span-1 col-start-1 row-span-1 h-full',
          'transition-colors duration-200',
          isOver && 'bg-primary/5 rounded-lg'
        )}
        id="dnd-canvas"
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
        {stories.map((story, index) => {
          const percentagePosition = positionToPercentage(story.position)

          return (
            <div
              key={story.id}
              className="absolute hover:!z-50"
              style={{
                ...percentagePosition,
                transform: 'translate(-50%, -50%)',
                zIndex: Math.min(index, 49), // need to be kept below 50 (for hover and dialogs)
              }}
            >
              <StoryCard
                story={story}
                onHotkey={handleStoryKey}
                onDoubleClick={() => onStoryDoubleClick?.(story)}
                onEdit={() => handleEditStory(story)}
                onDelete={() => handleDeleteStory(story)}
                onMakeAnchor={() => handleMakeAnchor(story)}
                enableDrag={!isEstimateMode}
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
                  Mission control ready...
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Deploy your beacon story to start exploring
                </p>
              </div>
              <Button onClick={openAddStoryDialog} size="lg">
                <SparkleIcon className="h-5 w-5" />
                Add a beacon
              </Button>
            </div>
          </div>
        )}

        {/* Drop zone indicator when dragging */}
        {isOver && (
          <div className="absolute inset-0 pointer-events-none z-50">
            <div className="absolute inset-4 border-2 border-dashed border-primary/30 rounded-lg animate-pulse" />
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
              More uncertainty
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <div className="w-3 h-px bg-muted-foreground" />
          <div className="absolute bottom-full right-0 whitespace-nowrap transform rotate-90 origin-right translate-x-3 translate-y-3">
            <span className="text-xs text-muted-foreground font-medium">
              Less uncertainty
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

PlanningCanvas.displayName = 'PlanningCanvas'
