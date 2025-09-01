'use client'

import { defineStepper } from '../stepper'
import {
  AnchorIcon,
  RectangleEllipsisIcon,
  SparkleIcon,
  Tally5Icon,
} from 'lucide-react'

import { Session, SessionActions } from './session'
import { Estimate, EstimateActions } from './estimate'
import { Plan, PlanActions } from './plan'
import { useParams } from 'next/navigation'
import { useDialogStore, usePlanningStore } from '@/stores'

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

  const { currentSession } = usePlanningStore()

  const anchorStoryPoints = currentSession?.anchorStoryPoints

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
  const { currentSession, setAnchorStoryPoints } = usePlanningStore()

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
            anchorStoryPoints={currentSession?.anchorStoryPoints}
            setAnchorStoryPoints={setAnchorStoryPoints}
          />
        ),
      })}
    </Stepper.Controls>
  )
}
