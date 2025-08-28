'use client'

import { defineStepper } from '../stepper'
import { AnchorIcon, RectangleEllipsisIcon, Tally5Icon } from 'lucide-react'

import { Session, SessionActions } from './session'
import { Estimate, EstimateActions } from './estimate'
import { Plan, PlanActions } from './plan'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

const { Stepper, useStepper, steps, utils } = defineStepper(
  {
    id: 'step-1',
    title: 'Session',
    description: 'Join or create a session',
    icon: <RectangleEllipsisIcon />,
  },
  {
    id: 'step-2',
    title: 'Plan',
    description: null,
    icon: <AnchorIcon />,
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
  const { code } = useParams()

  return (
    <>
      <Stepper.Provider
        className="flex flex-col gap-10 flex-1 container mx-auto py-4"
        initialStep={code ? 'step-2' : 'step-1'}
      >
        {({ methods }) => (
          <>
            <Stepper.Navigation>
              {methods.all.map(step => (
                <Stepper.Step key={step.id} of={step.id} icon={step.icon}>
                  <Stepper.Title>{step.title}</Stepper.Title>
                  {step.description && (
                    <Stepper.Description>
                      {code ?? step.description}
                    </Stepper.Description>
                  )}
                </Stepper.Step>
              ))}
            </Stepper.Navigation>
            <Stepper.Panel className="flex-1 flex flex-col">
              {methods.switch({
                'step-1': Session,
                'step-2': Plan,
                'step-3': Estimate,
              })}
            </Stepper.Panel>
            <Stepper.Controls className="flex items-center justify-center">
              <section className="bg-card shadow-md rounded-lg p-2">
                {methods.switch({
                  'step-1': SessionActions,
                  'step-2': PlanActions,
                  'step-3': EstimateActions,
                })}
              </section>
            </Stepper.Controls>
          </>
        )}
      </Stepper.Provider>
    </>
  )
}
