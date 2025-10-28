'use client'

import { defineStepper } from '../stepper'
import {
  FolderIcon,
  RectangleEllipsisIcon,
  SparkleIcon,
  Tally5Icon,
} from 'lucide-react'

import { Session, SessionActions } from './session'
import { Estimate, EstimateActions } from './estimate'
import { Plan, PlanActions } from './plan'
import { useParams, useRouter } from 'next/navigation'
import { useDialogStore, usePlanningStore } from '@/stores'
import { useSession } from '@/hooks/use-session'
import { useRecentSessions } from '@/hooks/use-recent-sessions'
import { useEffect, useRef } from 'react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty'
import { Button } from '../ui/button'

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
  const { setCurrentSession } = usePlanningStore()
  const { push } = useRouter()
  const { addRecentSession } = useRecentSessions()
  const addedRecentSessionForIdRef = useRef<string | null>(null)

  // Load session data when code is provided
  const { data, error } = useSession(code ?? '')

  // Update store when session data changes
  useEffect(() => {
    setCurrentSession(code)
  }, [code, setCurrentSession])

  // Track recent sessions once per session id when session data is loaded
  useEffect(() => {
    if (!data?.id) return
    if (addedRecentSessionForIdRef.current === data.id) return
    addRecentSession(data)
    addedRecentSessionForIdRef.current = data.id
  }, [data?.id, addRecentSession, data])

  if (code && error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderIcon />
          </EmptyMedia>
          <EmptyTitle>Session not found</EmptyTitle>
          <EmptyDescription>Session {code} does not exist</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button onClick={() => push('/')}>Go back</Button>
          </div>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <Stepper.Provider
        className="flex flex-col gap-10 flex-1 container mx-auto py-4"
        initialStep={
          code ? (data?.anchorStoryPoints ? 'step-3' : 'step-2') : 'step-1'
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

  const { data } = useSession(currentSession ?? '')

  return (
    <Stepper.Controls className="flex items-center justify-center">
      {stepSwitch({
        'step-1': () => <SessionActions />,
        'step-2': () => (
          <PlanActions
            onAddStory={openAddStoryDialog}
            stories={data?.stories ?? []}
            next={next}
          />
        ),
        'step-3': () => (
          <EstimateActions
            prev={prev}
            anchorStoryPoints={data?.anchorStoryPoints as null}
            sessionId={data?.id}
          />
        ),
      })}
    </Stepper.Controls>
  )
}
