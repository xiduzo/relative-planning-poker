'use client'

import { DndProvider } from '../DndProvider'
import { PlanningCanvas } from '../PlanningCanvas'
import { Button } from '../ui/button'
import { ArrowLeftIcon, BookCheckIcon, Tally5Icon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { FIBONACCI_NUMBERS, FibonacciNumber } from '@/types'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormControl,
  FormMessage,
} from '../ui/form'
import { useSetAnchorStoryPoints } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

export function Estimate() {
  return (
    <DndProvider>
      <PlanningCanvas />
    </DndProvider>
  )
}

const schema = z.object({
  anchorStoryPoints: z
    .union([...FIBONACCI_NUMBERS.map(x => z.literal(x))])
    .nonoptional(),
})

type EstimateForm = z.infer<typeof schema>

export function EstimateActions(props: {
  prev: () => void
  anchorStoryPoints?: FibonacciNumber | null
  sessionId?: string
}) {
  const [drawerOpen, setDrawerOpen] = useState(!props.anchorStoryPoints)
  const setAnchorStoryPointsMutation = useSetAnchorStoryPoints()

  const form = useForm<EstimateForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      anchorStoryPoints: undefined,
    },
  })

  const handleSetAnchorPoints = async (points: FibonacciNumber) => {
    if (!props.sessionId) return

    try {
      await setAnchorStoryPointsMutation.mutateAsync({
        sessionId: props.sessionId,
        points,
      })
      setDrawerOpen(false)
      form.reset()
    } catch (error) {
      console.error(error)
      // Error handling is done by TanStack Query
    }
  }

  const handleBackToPlan = async () => {
    if (!props.sessionId) return

    try {
      await setAnchorStoryPointsMutation.mutateAsync({
        sessionId: props.sessionId,
        points: null,
      })
      props.prev()
    } catch (error) {
      console.error(error)
      // Error handling is done by TanStack Query
    }
  }

  return (
    <section className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        onClick={handleBackToPlan}
        disabled={setAnchorStoryPointsMutation.isPending}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to the plan
      </Button>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            onClick={() => {
              form.reset()
            }}
            disabled={setAnchorStoryPointsMutation.isPending}
          >
            <Tally5Icon className="w-4 h-4" />
            Estimate beacon
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Estimate the beacon story points</DrawerTitle>
            <DrawerDescription className="max-w-lg mx-auto flex items-center gap-2 justify-center">
              Choose 5-13 points for best relative estimation
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Beacon stories work best in the middle range (5-13
                      points).
                    </p>
                    <p className="mt-1">
                      If your beacon story has very low (1-3) or high (21+)
                      points, consider setting a different story as the beacon
                      for better relative estimation across all stories.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(data => {
                handleSetAnchorPoints(data.anchorStoryPoints)
              })}
              className="container mx-auto flex flex-col items-center justify-center"
            >
              <FormField
                control={form.control}
                name="anchorStoryPoints"
                render={({ field }) => (
                  <FormItem className="my-10">
                    <FormLabel className="sr-only">Estimation points</FormLabel>
                    <FormDescription className="sr-only">
                      How many points do you think the beacon story is worth?
                    </FormDescription>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        value={field.value?.toString() ?? ''}
                        onValueChange={value => {
                          if (value) {
                            const numValue = parseInt(value) as FibonacciNumber
                            field.onChange(numValue)
                          } else {
                            field.onChange(null)
                          }
                        }}
                        className="flex flex-wrap"
                      >
                        {FIBONACCI_NUMBERS.map(number => (
                          <ToggleGroupItem
                            key={number}
                            value={number.toString()}
                            className={cn([
                              'w-12 h-12 text-sm',
                              [5, 8, 13].includes(number) && 'font-bold',
                            ])}
                          >
                            {number}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DrawerFooter className="w-md mx-auto">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !form.formState.isValid ||
                    setAnchorStoryPointsMutation.isPending
                  }
                >
                  <BookCheckIcon className="w-4 h-4" />
                  {setAnchorStoryPointsMutation.isPending
                    ? 'Estimating...'
                    : 'Estimate'}
                </Button>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </section>
  )
}
