/**
 * StoryCard component for displaying story information in the planning session
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Story } from '@/types';

export interface StoryCardProps {
    story: Story;
    className?: string;
    onClick?: () => void;
    onDoubleClick?: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
    story,
    className,
    onClick,
    onDoubleClick,
}) => {
    return (
        <Card
            role="article"
            aria-label={`Story: ${story.title}${story.isAnchor ? ' (Anchor Story)' : ''}`}
            tabIndex={onClick ? 0 : undefined}
            className={cn(
                // Base styles
                'cursor-pointer select-none transition-all duration-200 ease-in-out',
                'min-w-[200px] max-w-[280px] w-full',

                // Focus styles for keyboard navigation
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',

                // Hover states
                'hover:shadow-md hover:scale-[1.02] hover:border-primary/20',

                // Anchor story styling
                story.isAnchor && [
                    'border-primary bg-primary/5',
                    'shadow-md ring-1 ring-primary/20',
                    'hover:bg-primary/10 hover:ring-primary/30'
                ],

                // Non-anchor story styling
                !story.isAnchor && [
                    'border-border bg-card',
                    'hover:bg-accent/50'
                ],

                className
            )}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className={cn(
                        'text-sm font-medium leading-tight line-clamp-2',
                        story.isAnchor && 'text-primary'
                    )}>
                        <h3 className="text-inherit font-inherit leading-inherit">
                            {story.title}
                        </h3>
                    </CardTitle>

                    {story.isAnchor && (
                        <Badge
                            variant="secondary"
                            className="shrink-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            aria-label="Anchor story indicator"
                        >
                            <Anchor className="w-3 h-3 mr-1" aria-hidden="true" />
                            Anchor
                        </Badge>
                    )}
                </div>
            </CardHeader>

            {story.description && (
                <CardContent className="pt-0">
                    <CardDescription className="text-xs leading-relaxed line-clamp-3">
                        {story.description}
                    </CardDescription>
                </CardContent>
            )}

            {/* Visual indicator for relative position */}
            <div
                className={cn(
                    'absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-colors',
                    story.isAnchor && 'bg-primary/30',
                    !story.isAnchor && story.position < 0 && 'bg-green-400/60', // Lower complexity
                    !story.isAnchor && story.position > 0 && 'bg-orange-400/60', // Higher complexity
                    !story.isAnchor && story.position === 0 && 'bg-blue-400/60' // Same as anchor
                )}
                aria-hidden="true"
                role="presentation"
            />
        </Card>
    );
};

StoryCard.displayName = 'StoryCard';