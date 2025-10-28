'use client'

import { defineStepper } from '../stepper'
import { RectangleEllipsisIcon, SparkleIcon, Tally5Icon } from 'lucide-react'

import { Session, SessionActions } from './session'
import { Estimate, EstimateActions } from './estimate'
import { Plan, PlanActions } from './plan'
import { useParams } from 'next/navigation'
import { useDialogStore, usePlanningStore } from '@/stores'
import { useSession } from '@/hooks/use-session'
import { useEffect } from 'react'

const { Stepper, useStepper, steps, utils } = defineStepper(
  {
    id: 'step-1',
    title: 'Session',
    description: 'connect', // Will get replaced with the session code
    icon: <RectangleEllipsisIcon />,
  },
  {
    id: 'step-2',
    title: 'Explore',
    description: null,
    icon: <SparkleIcon />,
  },
  {
    id: 'step-3',
    title: 'Estimate',
    description: null,
    icon: <Tally5Icon />,
  }
)

export { useStepper, steps, utils }

export function MainStepper() {
  const { code } = useParams<{ code: string }>()
  const { currentSession, setCurrentSession } = usePlanningStore()

  // Load session data when code is provided
  const { data: sessionData, isLoading, error } = useSession(code || '')

  // Update store when session data changes
  useEffect(() => {
    if (sessionData) {
      setCurrentSession(sessionData)
    }
  }, [sessionData, setCurrentSession])

  const anchorStoryPoints = currentSession?.anchorStoryPoints

  // Show loading state while fetching session
  if (code && isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  // Show error state if session not found
  if (code && error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Session not found</h2>
          <p className="text-muted-foreground">
            The session code &quot;{code}&quot; does not exist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Stepper.Provider
        className="flex flex-col gap-10 flex-1 container mx-auto py-4"
        initialStep={
          code ? (anchorStoryPoints ? 'step-3' : 'step-2') : 'step-1'
        }
      >
        <Navigation code={code} />
        <Panel />
        <Controls />
      </Stepper.Provider>
    </>
  )
}

function Navigation(props: { code?: string }) {
  return (
    <Stepper.Navigation>
      {steps.map(step => (
        <Stepper.Step key={step.id} of={step.id} icon={step.icon}>
          <Stepper.Title>{step.title}</Stepper.Title>
          {step.description && (
            <Stepper.Description>
              {props.code ?? step.description}
            </Stepper.Description>
          )}
        </Stepper.Step>
      ))}
    </Stepper.Navigation>
  )
}

function Panel() {
  const { switch: stepSwitch } = useStepper()
  const { openEditStoryDialog } = useDialogStore()

  return (
    <Stepper.Panel className="flex-1 flex flex-col">
      {stepSwitch({
        'step-1': () => <Session />,
        'step-2': () => <Plan onStoryDoubleClick={openEditStoryDialog} />,
        'step-3': () => <Estimate />,
      })}
    </Stepper.Panel>
  )
}

function Controls() {
  const { switch: stepSwitch, next, prev } = useStepper()
  const { openAddStoryDialog } = useDialogStore()
  const { currentSession } = usePlanningStore()

  return (
    <Stepper.Controls className="flex items-center justify-center">
      {stepSwitch({
        'step-1': () => <SessionActions />,
        'step-2': () => (
          <PlanActions
            onAddStory={openAddStoryDialog}
            stories={currentSession?.stories ?? []}
            next={next}
          />
        ),
        'step-3': () => (
          <EstimateActions
            prev={prev}
            anchorStoryPoints={currentSession?.anchorStoryPoints as null}
            sessionId={currentSession?.id}
          />
        ),
      })}
    </Stepper.Controls>
  )
}
