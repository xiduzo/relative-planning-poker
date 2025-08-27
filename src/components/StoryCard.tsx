/**
 * StoryCard component for displaying story information in the planning session
 */

'use client'

import React from 'react'
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
import {
  Anchor,
  AnchorIcon,
  BriefcaseBusinessIcon,
  CrosshairIcon,
  Edit,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPositionColorClass } from '@/utils/color'
import type { Story } from '@/types'

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
        // Invert the x transform to match our corrected drag direction
        // This ensures the visual drag follows the mouse correctly
        transform: `translate3d(${-transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

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
        'select-none transition-all duration-200 ease-in-out relative',
        'min-w-[200px] max-w-[280px] w-full',

        // Hover states (disabled when dragging)
        !isCurrentlyDragging &&
          !story.isAnchor && [
            'hover:shadow-md hover:scale-[1.02] hover:border-primary/20',
          ],

        // Dragging states
        isCurrentlyDragging && [
          'opacity-50 scale-105 shadow-2xl z-50',
          'transform-gpu will-change-transform',
        ],

        // Anchor story styling
        story.isAnchor && [
          'border-primary bg-primary-muted',
          'shadow-md ring-1 ring-primary/20',
          'opacity-80 -z-10',
        ],

        // Non-anchor story styling
        !story.isAnchor && [
          'cursor-pointer',
          'border-border bg-card',
          !isCurrentlyDragging && 'hover:bg-accent/50',
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
        <CardTitle
          className={cn(
            'text-sm font-medium leading-tight line-clamp-2 flex-1',
            story.isAnchor && 'text-primary'
          )}
        >
          <h3 className="text-inherit font-inherit leading-inherit">
            {story.title}
          </h3>
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed line-clamp-3">
          {!story.isAnchor && (
            <Badge
              variant="secondary"
              aria-label="Story point indication"
              className={getPositionColorClass(story.position)}
            >
              <BriefcaseBusinessIcon
                className="w-3 h-3 mr-1"
                aria-hidden="true"
              />
              Work estimate
            </Badge>
          )}
          {story.isAnchor && (
            <Badge variant="secondary" aria-label="Anchor story indicator">
              <AnchorIcon className="w-3 h-3 mr-1" aria-hidden="true" />
              Anchor
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      {story.description && (
        <CardContent className="pt-0">
          <CardDescription className="text-xs leading-relaxed line-clamp-3">
            {story.description}
          </CardDescription>
        </CardContent>
      )}

      {/* Debug position info */}
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground font-mono">
          <div className="flex flex-col justify-between">
            <span>X: {story.position.x}</span>
            <span>Y: {story.position.y}</span>
            <span>Sum: {story.position.x + -story.position.y}</span>
          </div>
        </div>
      </CardContent>
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
