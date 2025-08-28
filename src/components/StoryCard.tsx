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
  CardAction,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Anchor, AnchorIcon, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculatePositionScore } from '@/utils/position'
import type { Story } from '@/types'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

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
  isDragging = false,
  enableDrag = true,
}) => {
  // Anchor stories cannot be dragged
  const canDrag = enableDrag && !story.isAnchor

  const draggableProps = useDraggable({
    id: story.id,
    data: {
      story,
    },
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

  const isCurrentlyDragging = isDragging || isDraggingFromHook

  const style = transform
    ? {
        // Apply the transform directly to follow the mouse movement
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const cardScore = useMemo(() => {
    return calculatePositionScore(story.position)
  }, [story.position])

  const cardContent = (
    <Card
      ref={enableDrag ? setNodeRef : undefined}
      style={style}
      role={enableDrag ? 'button' : 'article'}
      aria-label={`Story: ${story.title}${story.isAnchor ? ' (Anchor Story)' : ''}`}
      tabIndex={enableDrag ? 0 : onClick ? 0 : undefined}
      data-story-id={story.id}
      className={cn(
        // Base styles
        'select-none transition-all duration-200 ease-in-out',
        'w-full max-w-xs min-w-[175px]',
        'border-border bg-card',

        // Hover states (disabled when dragging)
        !isCurrentlyDragging &&
          !story.isAnchor && [
            'hover:shadow-md hover:scale-[1.02] hover:border-primary/20',
          ],

        // Dragging states
        isCurrentlyDragging && [
          'opacity-5 scale-105 shadow-2xl',
          'transform-gpu will-change-transform',
        ],

        // Anchor story styling
        story.isAnchor && ['bg-muted'],

        // Non-anchor story styling
        !story.isAnchor && [
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
      <CardHeader className="pb-3">
        <CardTitle>{story.title}</CardTitle>
        <CardAction>
          {!story.isAnchor && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    'h-3 w-5 -translate-y-1 rounded-full',
                    'bg-red-500',
                    cardScore > 1 && ['bg-orange-500'],
                    cardScore > 2 && ['bg-amber-500'],
                    cardScore > 3 && ['bg-yellow-500'],
                    cardScore > 4 && ['bg-lime-500'],
                    cardScore > 5 && ['bg-green-500'],
                    cardScore > 7 && ['bg-emerald-500'],
                    cardScore > 8 && ['bg-teal-500']
                  )}
                  aria-label="Story point indication"
                >
                  {/* For debugging purposes, we'll show the score as a number */}
                  {/* {scoreFormatter.format(cardScore)} */}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  This indicates the amount of work required to complete the
                  story.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {story.isAnchor && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" aria-label="Anchor story indicator">
                  <AnchorIcon className="w-3 h-3" aria-hidden="true" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Your anchor story acts as the reference point for the other
                  stories.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardAction>
        {story.isAnchor && <CardDescription>Anchor story</CardDescription>}
      </CardHeader>

      {story.description && (
        <CardContent className="max-w-xs">
          <CardDescription className="text-xs leading-relaxed line-clamp-3">
            {story.description}
          </CardDescription>
        </CardContent>
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
              <Edit className="mr-2 h-4 w-4" />
              Edit Story
            </ContextMenuItem>
          )}
          {onMakeAnchor && !story.isAnchor && (
            <ContextMenuItem onClick={onMakeAnchor}>
              <Anchor className="mr-2 h-4 w-4" />
              Make Anchor Story
            </ContextMenuItem>
          )}
          {(onEdit || onMakeAnchor) && onDelete && <ContextMenuSeparator />}
          {onDelete && (
            <ContextMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Story
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return cardContent
}

StoryCard.displayName = 'StoryCard'
