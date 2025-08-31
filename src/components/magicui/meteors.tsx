'use client'

import { cn } from '@/lib/utils'
import React, { useEffect, useState, useCallback, useRef } from 'react'

interface MeteorsProps {
  number?: number
  minDelay?: number
  maxDelay?: number
  minDuration?: number
  maxDuration?: number
  angle?: number
  className?: string
}

interface Meteor {
  id: string
  angle: number
  left: number
  delay: number
  duration: number
  opacity: number
}

export const Meteors = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 1,
  maxDuration = 3,
  angle = 215,
  className,
}: MeteorsProps) => {
  const [meteors, setMeteors] = useState<Meteor[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const generateMeteor = useCallback(
    (): Meteor => ({
      id: Math.random().toString(36).substr(2, 9),
      angle: -angle + (Math.random() - 0.5) * 5,
      left: Math.floor(
        Math.random() *
          (typeof window !== 'undefined' ? window.innerWidth : 1200)
      ),
      delay: Math.random() * (maxDelay - minDelay) + minDelay,
      duration: Math.random() * (maxDuration - minDuration) + minDuration,
      opacity: Math.random() * 0.3 + 0.3,
    }),
    [angle, maxDelay, minDelay, maxDuration, minDuration]
  )

  const setupMeteorTimeout = useCallback((meteor: Meteor) => {
    // The meteor should live for: delay + duration + buffer time
    // Ensure minimum buffer time of 0.5s for very short durations
    const bufferTime = Math.max(1.5, meteor.duration * 0.2) // At least 1.5s or 20% of duration
    const totalTime = (meteor.delay + meteor.duration + bufferTime) * 1000
    console.log(meteor)
    const timeout = setTimeout(() => {
      removeMeteor(meteor.id)
    }, totalTime)
    timeoutsRef.current.set(meteor.id, timeout)
  }, [])

  const spawnMeteor = useCallback(() => {
    const newMeteor = generateMeteor()

    setMeteors(prev => [...prev, newMeteor])
    setupMeteorTimeout(newMeteor)
  }, [generateMeteor, setupMeteorTimeout])

  const removeMeteor = useCallback(
    (id: string) => {
      // Clear the timeout for this meteor
      const timeout = timeoutsRef.current.get(id)
      if (timeout) {
        clearTimeout(timeout)
        timeoutsRef.current.delete(id)
      }

      setMeteors(prev => prev.filter(meteor => meteor.id !== id))

      // Spawn a new meteor to replace the removed one
      setTimeout(() => spawnMeteor(), Math.random() * 1000) // Random delay before spawning new meteor
    },
    [spawnMeteor]
  )

  // Initialize meteors
  useEffect(() => {
    const initialMeteors = Array.from({ length: number }, () =>
      generateMeteor()
    )
    setMeteors(initialMeteors)

    // Set up timeouts for initial meteors
    initialMeteors.forEach(meteor => {
      setupMeteorTimeout(meteor)
    })

    // Cleanup function
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
    }
  }, [number, generateMeteor, setupMeteorTimeout])

  return (
    <>
      {meteors.map(meteor => (
        <span key={meteor.id} style={{ opacity: meteor.opacity }}>
          <span
            style={
              {
                '--angle': meteor.angle + 'deg',
                '--meteor-duration': meteor.duration + 's',
                top: '-5%',
                left: `calc(0% + ${meteor.left}px)`,
                animationDelay: meteor.delay + 's',
              } as React.CSSProperties & {
                '--angle': string
                '--meteor-duration': string
              }
            }
            className={cn(
              'pointer-events-none -z-50 absolute size-0.5 rotate-[var(--angle)] animate-meteor rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10]',
              className
            )}
          >
            {/* Meteor Tail */}
            <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-zinc-500 to-transparent" />
          </span>
        </span>
      ))}
    </>
  )
}
