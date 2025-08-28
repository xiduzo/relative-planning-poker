'use client'

import { useDialogStore, usePlanningStore } from '@/stores'
import { DndProvider } from '../DndProvider'
import { PlanningCanvas } from '../PlanningCanvas'
import { Button } from '../ui/button'
import { ArrowLeftIcon, BookCheckIcon } from 'lucide-react'
import { useStepper } from './main-stepper'

export function Estimate() {
  return (
    <DndProvider>
      <PlanningCanvas />
    </DndProvider>
  )
}

export function EstimateActions() {
  const { prev } = useStepper()

  return (
    <section className="flex items-center justify-center gap-4">
      <Button variant="outline" onClick={prev}>
        <ArrowLeftIcon className="w-4 h-4" />
        Back to the plan
      </Button>
      <Button>
        Finish
        <BookCheckIcon className="w-4 h-4" />
      </Button>
    </section>
  )
}
