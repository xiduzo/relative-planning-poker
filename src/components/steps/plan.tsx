'use client'

import { useDialogStore } from '@/stores'
import { DndProvider } from '../DndProvider'
import { PlanningCanvas } from '../PlanningCanvas'
import { StoryDialog } from '../StoryDialog'
import { useStepper } from './main-stepper'
import { Button } from '../ui/button'
import { usePlanningStore } from '@/stores/planning-store'

export function Plan() {
  const { openEditStoryDialog } = useDialogStore()

  return (
    <DndProvider>
      <StoryDialog />
      <PlanningCanvas onStoryDoubleClick={openEditStoryDialog} />
    </DndProvider>
  )
}

export function PlanActions() {
  const { next } = useStepper()
  const { openAddStoryDialog } = useDialogStore()
  const { currentSession } = usePlanningStore()

  if (!currentSession) return null

  const { stories } = currentSession

  return (
    <section className="flex items-center justify-center gap-4">
      <Button onClick={openAddStoryDialog} disabled={stories.length < 1}>
        Add a new Story
      </Button>
      <Button variant="outline" onClick={next} disabled={stories.length < 2}>
        Go estimate
      </Button>
    </section>
  )
}
