'use client'

import { defineStepper } from '../stepper'
import { AnchorIcon, RectangleEllipsisIcon, Tally5Icon } from 'lucide-react'

export const { Stepper, useStepper, steps, utils } = defineStepper(
  {
    id: 'step-1',
    title: 'Session',
    description: 'XXXXX',
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
