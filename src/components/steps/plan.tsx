'use client'

import { DndProvider } from '../DndProvider'
import { PlanningCanvas } from '../PlanningCanvas'
import { StoryDialog } from '../StoryDialog'
import { Button } from '../ui/button'
import { ArrowRightIcon, PlusIcon } from 'lucide-react'
import { Story } from '@/types'

export function Plan(props: { onStoryDoubleClick: (story: Story) => void }) {
  return (
    <DndProvider>
      <StoryDialog />
      <PlanningCanvas onStoryDoubleClick={props.onStoryDoubleClick} />
    </DndProvider>
  )
}

export function PlanActions(props: {
  onAddStory: () => void
  stories: Story[]
  next: () => void
}) {
  return (
    <section className="flex items-center justify-center gap-4">
      <Button onClick={props.onAddStory} disabled={props.stories.length < 1}>
        <PlusIcon className="w-4 h-4" />
        Add a new story
      </Button>
      <Button
        variant="outline"
        onClick={props.next}
        disabled={props.stories.length < 2}
      >
        Go estimate
        <ArrowRightIcon className="w-4 h-4" />
      </Button>
    </section>
  )
}
