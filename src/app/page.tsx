'use client'

import React, { useEffect } from 'react'
import { PlanningCanvas } from '@/components/PlanningCanvas'
import { StoryDialog } from '@/components/StoryDialog'
import { Button } from '@/components/ui/button'
import { usePlanningStore } from '@/stores/planning-store'
import { useDialogStore } from '@/stores/dialog-store'
import { Plus } from 'lucide-react'
import type { Story } from '@/types'
import { DndProvider } from '@/components/DndProvider'

export default function Home() {
  const { currentSession, createSession } = usePlanningStore()
  const { openAddStoryDialog, openEditStoryDialog } = useDialogStore()

  useEffect(() => {
    // Create a demo session if none exists
    if (!currentSession) {
      createSession('Demo Planning Session')
    }
  }, [currentSession, createSession])

  const handleStoryDoubleClick = (story: Story) => {
    console.log('Story double-clicked:', story.title)
    // Open edit dialog when story is double-clicked
    openEditStoryDialog(story)
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">
            Setting up your planning session
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DndProvider>
        <PlanningCanvas onStoryDoubleClick={handleStoryDoubleClick} />
      </DndProvider>
      <StoryDialog />
    </>
  )
}
