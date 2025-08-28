'use client'

import { usePlanningStore } from '@/stores/planning-store'
import { useEffect, useRef } from 'react'
import { useStepper } from './main-stepper'

export function InitialiseStepper() {
  const { currentSession } = usePlanningStore()
  const { next } = useStepper()
  const hasMoved = useRef(false)

  useEffect(() => {
    if (currentSession && !hasMoved.current) {
      // next()
      hasMoved.current = true
    }
  }, [currentSession, next, hasMoved])

  console.log(currentSession)

  return null
}
