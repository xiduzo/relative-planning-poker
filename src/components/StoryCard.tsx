/**
 * StoryCard component for displaying story information in the planning session
 */

'use client'

import React, { useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { EditIcon, SparkleIcon, Trash2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculatePositionScore, calculateStoryPoints } from '@/utils/position'
import type { Story } from '@/types'
import { usePlanningStore } from '@/stores/planning-store'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { useHotkeys } from 'react-hotkeys-hook'
import { BorderBeam } from './magicui/border-beam'

const scoreFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

export interface StoryCardProps {
  story: Story
  className?: string
  onClick?: () => void
  onDoubleClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onMakeAnchor?: () => void
  onHotkey?: (event: KeyboardEvent, story: Story) => void
  isDragging?: boolean
  enableDrag?: boolean
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  className,
  onClick,
  onDoubleClick,
  onEdit,
  onDelete,
  onMakeAnchor,
  onHotkey,
  isDragging = false,
  enableDrag = true,
}) => {
  const currentSession = usePlanningStore(state => state.currentSession)
  const anchorStoryPoints = currentSession?.anchorStoryPoints

  // Anchor stories cannot be dragged
  const canDrag = enableDrag && !story.isAnchor

  const draggableProps = useDraggable({
    id: story.id,
    data: { story },
    disabled: !canDrag,
  })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingFromHook,
  } = enableDrag
    ? draggableProps
    : {
        attributes: {},
        listeners: {},
        setNodeRef: () => {},
        transform: null,
        isDragging: false,
      }

  const hotkeyRef = useHotkeys<HTMLDivElement>(
    ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Backspace'],
    event => onHotkey?.(event, story),
    {
      enabled: enableDrag,
      ignoreModifiers: true,
      preventDefault: false,
      enableOnFormTags: false,
    }
  )

  const isCurrentlyDragging = isDragging || isDraggingFromHook

  // Create a ref callback that handles both drag and hotkey refs
  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // Set the hotkey ref
      if (hotkeyRef && 'current' in hotkeyRef) {
        hotkeyRef.current = node
      }

      // Set the drag ref when dragging is enabled
      if (enableDrag) {
        setNodeRef(node)
      }
    },
    [hotkeyRef, setNodeRef, enableDrag]
  )

  const style = transform
    ? {
        // Apply the transform directly to follow the mouse movement
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const cardScore = useMemo(() => {
    return calculatePositionScore(story.position)
  }, [story.position])

  const storyPoints = useMemo(() => {
    return calculateStoryPoints(story, anchorStoryPoints as null)
  }, [anchorStoryPoints, story])

  const cardContent = (
    <Card
      ref={combinedRef}
      style={style}
      role={enableDrag ? 'button' : 'article'}
      aria-label={`Story: ${story.title}${story.isAnchor ? ' (Anchor Story)' : ''}`}
      tabIndex={enableDrag || onHotkey ? 0 : onClick ? 0 : undefined}
      data-story-id={story.id}
      className={cn(
        // Base styles
        'select-none transition-all duration-200 ease-in-out',
        'w-full max-w-[175px] min-w-[175px]',
        'border-border bg-card gap-3 py-4',

        // Hover states (disabled when dragging)
        !isCurrentlyDragging &&
          !story.isAnchor &&
          !anchorStoryPoints && [
            'hover:shadow-md hover:scale-[1.02] hover:border-primary/20',
          ],

        // Dragging states
        isCurrentlyDragging && [
          'opacity-5 scale-105 shadow-2xl',
          'transform-gpu will-change-transform',
        ],

        // Non-anchor story styling
        !story.isAnchor &&
          !anchorStoryPoints && [
            'cursor-pointer',
            // Focus styles for keyboard navigation
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          ],

        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      {...(enableDrag ? { ...attributes, ...listeners } : {})}
    >
      <CardHeader className="px-4">
        <CardTitle>{story.title}</CardTitle>
        <CardDescription>
          {!story.isAnchor && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    'bg-red-500 text-white',
                    'text-xs font-extrabold w-9',
                    cardScore > 1 && ['bg-orange-500'],
                    cardScore > 2 && ['bg-amber-500'],
                    cardScore > 3 && ['bg-yellow-500'],
                    cardScore > 4 && ['bg-lime-500'],
                    cardScore > 5 && ['bg-green-500'],
                    cardScore > 7 && ['bg-emerald-500'],
                    cardScore > 8 && ['bg-teal-500'],
                    cardScore > 9 && ['bg-cyan-500']
                  )}
                  aria-label={
                    anchorStoryPoints
                      ? 'Story point estimation'
                      : 'Story point indication'
                  }
                >
                  <div
                    className={anchorStoryPoints ? 'opacity-100' : 'opacity-0'}
                  >
                    {scoreFormatter.format(storyPoints ?? 0)}
                  </div>
                </Badge>
              </TooltipTrigger>
              {!anchorStoryPoints && (
                <TooltipContent>
                  This indicates the amount of work required to complete the
                  story.
                </TooltipContent>
              )}
              {anchorStoryPoints && (
                <TooltipContent>
                  Estimated story points based on distance from beacon story.
                </TooltipContent>
              )}
            </Tooltip>
          )}
          {story.isAnchor && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="min-w-9 h-5"
                  aria-label="Anchor story indicator"
                >
                  <SparkleIcon aria-hidden="true" />
                  {anchorStoryPoints}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Your beacon story acts as the reference point for the other
                stories.
              </TooltipContent>
            </Tooltip>
          )}
        </CardDescription>
      </CardHeader>

      {story.description && (
        <CardContent className="px-4">
          <CardDescription className="text-xs leading-relaxed line-clamp-3">
            {story.description}
          </CardDescription>
        </CardContent>
      )}

      {story.isAnchor && (
        <BorderBeam
          duration={16}
          size={100}
          className="from-transparent via-blue-500 to-transparent"
        />
      )}
    </Card>
  )

  // Wrap in context menu if we have context menu actions
  if (onEdit || onDelete || onMakeAnchor) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {onEdit && (
            <ContextMenuItem onClick={onEdit}>
              <EditIcon className="h-4 w-4" />
              Edit story
            </ContextMenuItem>
          )}
          {onMakeAnchor && !story.isAnchor && (
            <ContextMenuItem onClick={onMakeAnchor}>
              <SparkleIcon className="h-4 w-4" />
              Set as beacon
            </ContextMenuItem>
          )}
          {(onEdit || onMakeAnchor) && onDelete && <ContextMenuSeparator />}
          {onDelete && (
            <ContextMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="h-4 w-4" />
              Delete story
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return cardContent
}

StoryCard.displayName = 'StoryCard'
