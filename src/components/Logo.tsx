import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        className={cn('flex-shrink-0', sizeClasses[size])}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background canvas */}
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="8"
          fill="url(#canvasGradient)"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
        />

        {/* Grid lines */}
        <path
          d="M12 12 L36 12 M12 24 L36 24 M12 36 L36 36 M24 12 L24 36"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          className="text-muted-foreground/30"
        />

        {/* Story cards positioned on canvas */}
        <g className="text-primary">
          {/* Top-left story (low complexity, low uncertainty) */}
          <rect
            x="8"
            y="8"
            width="8"
            height="6"
            rx="2"
            fill="currentColor"
            opacity="0.8"
          />
          <rect
            x="9"
            y="9"
            width="6"
            height="1"
            rx="0.5"
            fill="white"
            opacity="0.9"
          />
          <rect
            x="9"
            y="11"
            width="4"
            height="1"
            rx="0.5"
            fill="white"
            opacity="0.7"
          />

          {/* Center story (medium complexity, medium uncertainty) */}
          <rect
            x="20"
            y="20"
            width="8"
            height="6"
            rx="2"
            fill="currentColor"
            opacity="0.9"
          />
          <rect
            x="21"
            y="21"
            width="6"
            height="1"
            rx="0.5"
            fill="white"
            opacity="0.9"
          />
          <rect
            x="21"
            y="23"
            width="5"
            height="1"
            rx="0.5"
            fill="white"
            opacity="0.7"
          />

          {/* Bottom-right story (high complexity, high uncertainty) */}
          <rect
            x="32"
            y="32"
            width="8"
            height="6"
            rx="2"
            fill="currentColor"
            opacity="0.7"
          />
          <rect
            x="33"
            y="33"
            width="6"
            height="1"
            rx="0.5"
            fill="white"
            opacity="0.9"
          />
          <rect
            x="33"
            y="35"
            width="3"
            height="1"
            rx="0.5"
            fill="white"
            opacity="0.7"
          />
        </g>

        {/* Connection lines between stories */}
        <path
          d="M16 11 L20 20"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          className="text-muted-foreground/50"
        />
        <path
          d="M28 23 L32 32"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          className="text-muted-foreground/50"
        />

        {/* Gradients */}
        <defs>
          <linearGradient
            id="canvasGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="currentColor"
              stopOpacity="0.02"
              className="text-primary"
            />
            <stop
              offset="100%"
              stopColor="currentColor"
              stopOpacity="0.08"
              className="text-primary"
            />
          </linearGradient>
        </defs>
      </svg>

      {/* Text logo */}
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-none tracking-tight">
          StoryScape
        </span>
        <span className="text-xs text-muted-foreground font-medium leading-none">
          Relative Planning
        </span>
      </div>
    </div>
  )
}

Logo.displayName = 'Logo'
