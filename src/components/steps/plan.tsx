'use client'

import { useDialogStore } from '@/stores'
import { DndProvider } from '../DndProvider'
import { PlanningCanvas } from '../PlanningCanvas'

export function Plan() {
  const { openEditStoryDialog } = useDialogStore()

  return (
    <DndProvider>
      <PlanningCanvas onStoryDoubleClick={openEditStoryDialog} />
    </DndProvider>
  )
}

export function PlanActions() {
  return <div>PlanActions</div>
}
