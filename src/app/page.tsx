'use client'

import React from 'react'
import { PlanningCanvas } from '@/components/PlanningCanvas'
import { StoryDialog } from '@/components/StoryDialog'
import { Button } from '@/components/ui/button'
import { usePlanningStore } from '@/stores/planning-store'
import { useDialogStore } from '@/stores/dialog-store'
import { Plus } from 'lucide-react'
import type { Story } from '@/types'

export default function Home() {
  const { currentSession, createSession } = usePlanningStore()
  const { openAddStoryDialog, openEditStoryDialog } = useDialogStore()

  React.useEffect(() => {
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Relative Planning Poker</h1>
              <p className="text-sm text-muted-foreground">
                Session: {currentSession.name}
              </p>
            </div>
            <Button onClick={openAddStoryDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Story
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Stories</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Drag stories in 2D space to position them relative to the anchor
            story. Left/Right = Complexity (Lower/Higher), Up/Down = Uncertainty
            (Lower/Higher). The anchor story (center) cannot be moved.
            Double-click a story to edit it, or right-click for more options.
          </p>
        </div>

        <PlanningCanvas onStoryDoubleClick={handleStoryDoubleClick} />
      </main>

      <StoryDialog />
    </div>
  )
}
