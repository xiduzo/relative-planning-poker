'use client'

import React from 'react'
import { StoryDialog } from '@/components/StoryDialog'
import { Stepper } from '@/components/steps/main-stepper'
import { Session, SessionActions } from '@/components/steps/session'
import { Estimate, EstimateActions } from '@/components/steps/estimate'
import { Plan, PlanActions } from '@/components/steps/plan'
import { InitialiseStepper } from '@/components/steps/initialise-stepper'

export default function Home() {
  return (
    <>
      <Stepper.Provider className="flex flex-col gap-10 flex-1 container mx-auto py-4">
        {({ methods }) => (
          <>
            <Stepper.Navigation>
              <InitialiseStepper />
              {methods.all.map(step => (
                <Stepper.Step key={step.id} of={step.id} icon={step.icon}>
                  <Stepper.Title>{step.title}</Stepper.Title>
                  <Stepper.Description>{step.description}</Stepper.Description>
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
      <StoryDialog />
    </>
  )
}
