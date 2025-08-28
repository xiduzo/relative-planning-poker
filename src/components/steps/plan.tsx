'use client'

import { useDialogStore } from '@/stores'
import { DndProvider } from '../DndProvider'
import { PlanningCanvas } from '../PlanningCanvas'
import { StoryDialog } from '../StoryDialog'

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
  return <div>PlanActions</div>
}
