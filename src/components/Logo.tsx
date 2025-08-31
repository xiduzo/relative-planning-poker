import React from 'react'
import { cn } from '@/lib/utils'
import { RocketIcon, SparkleIcon } from 'lucide-react'

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
      <RocketIcon className={cn('flex-shrink-0', sizeClasses[size])} />

      {/* Text logo */}
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-none tracking-tight">
          Pokernaut
        </span>
        <span className="text-xs text-muted-foreground font-medium leading-none">
          Navigate your estimates with confidence
        </span>
      </div>
    </div>
  )
}

Logo.displayName = 'Logo'
