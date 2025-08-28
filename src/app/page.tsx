'use client'

import React, { useEffect } from 'react'
import { PlanningCanvas } from '@/components/PlanningCanvas'
import { StoryDialog } from '@/components/StoryDialog'
import { usePlanningStore } from '@/stores/planning-store'
import { useDialogStore } from '@/stores/dialog-store'
import type { Story } from '@/types'
import { DndProvider } from '@/components/DndProvider'
import { defineStepper } from '@/components/stepper'
import { AnchorIcon, GridIcon, MoveIcon, Tally5Icon } from 'lucide-react'

const { Stepper } = defineStepper(
  {
    id: 'step-1',
    title: 'Anchor',
    icon: <AnchorIcon />,
  },
  {
    id: 'step-2',
    title: 'Plan',
    icon: <MoveIcon />,
  },
  {
    id: 'step-3',
    title: 'Estimate',
    icon: <Tally5Icon />,
  }
)

export default function Home() {
  const { currentSession, createSession } = usePlanningStore()
  const { openEditStoryDialog } = useDialogStore()

  useEffect(() => {
    // Create a demo session if none exists
    if (!currentSession) {
      createSession('Demo Planning Session')
    }
  }, [currentSession, createSession])

  if (!currentSession) {
    // TODO: able to create a new session
    return (
      <div className="flex flex-1 items-center justify-center">
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
      <section>
        <Stepper.Provider>
          {({ methods }) => (
            <Stepper.Navigation className="mb-12">
              {methods.all.map(step => (
                <Stepper.Step
                  of={step.id}
                  onClick={() => methods.goTo(step.id)}
                  icon={step.icon}
                >
                  <Stepper.Title>{step.title}</Stepper.Title>
                </Stepper.Step>
              ))}
            </Stepper.Navigation>
          )}
        </Stepper.Provider>
      </section>
      <DndProvider>
        <PlanningCanvas onStoryDoubleClick={openEditStoryDialog} />
      </DndProvider>
      <section>ACTION MENU</section>
      <StoryDialog />
    </>
  )
}
