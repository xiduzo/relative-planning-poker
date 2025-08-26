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
import { Plus } from 'lucide-react'
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

  const handleAddAnchorStory = () => {
    openAddStoryDialog()
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 2D Axis Visualization */}
      <div className="relative px-4">
        <div className="relative h-8 flex items-center">
          {/* X-axis line (Complexity) */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-border -translate-y-1/2" />

          {/* Y-axis line (Uncertainty) */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-border -translate-x-1/2" />

          {/* Complexity indicators */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="h-3 w-px bg-green-500" />
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs text-green-600 font-medium">Lower</span>
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-6 w-6 bg-primary rounded-full border-2 border-background" />
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

          {/* Uncertainty indicators */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <div className="w-3 h-px bg-blue-500" />
            <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2 whitespace-nowrap">
              <span className="text-xs text-blue-600 font-medium">Lower</span>
            </div>
          </div>

          <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
            <div className="w-3 h-px bg-purple-500" />
            <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2 whitespace-nowrap">
              <span className="text-xs text-purple-600 font-medium">
                Higher
              </span>
            </div>
          </div>
        </div>

        {/* Axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-8">
          <span>Lower Complexity</span>
          <span className="text-primary font-medium">Reference Point</span>
          <span>Higher Complexity</span>
        </div>

        <div className="flex flex-col items-center text-xs text-muted-foreground mt-2">
          <span>Lower Uncertainty</span>
          <span className="text-primary font-medium">Reference Point</span>
          <span>Higher Uncertainty</span>
        </div>
      </div>

      {/* 2D Story Positioning Area */}
      <div
        ref={combinedRef}
        className={cn(
          'relative min-h-[500px] w-full px-4',
          'transition-colors duration-200',
          isOver && 'bg-primary/5 rounded-lg',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2'
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
                onClick={handleAddAnchorStory}
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
                .sort((a, b) => {
                  // Sort by distance from center (anchor)
                  const aDistance = Math.sqrt(
                    a.position.x ** 2 + a.position.y ** 2
                  )
                  const bDistance = Math.sqrt(
                    b.position.x ** 2 + b.position.y ** 2
                  )
                  return aDistance - bDistance
                })
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
                    <div className="text-muted-foreground font-mono text-right">
                      <div>
                        C: {story.position.x > 0 ? '+' : ''}
                        {story.position.x}
                      </div>
                      <div>
                        U: {story.position.y > 0 ? '+' : ''}
                        {story.position.y}
                      </div>
                    </div>
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
