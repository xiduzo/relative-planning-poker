'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { usePlanningStore } from '@/stores/planning-store'
import { generateSessionId, sessionIdToReadableFormat } from '@/utils/id'
import { PlanningSessionSchema } from '@/types'
import { useStepper } from './main-stepper'
import { toast } from 'sonner'
import { getErrorMessage } from '@/utils'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { useRouter } from 'next/navigation'
import { getRandomItem } from '@/utils/array'

const joinSessionSchema = PlanningSessionSchema.pick({
  code: true,
})
type JoinSessionForm = z.infer<typeof joinSessionSchema>

export function Session() {
  const { loadSessionByCode, sessions } = usePlanningStore()
  const router = useRouter()
  const form = useForm<JoinSessionForm>({
    resolver: zodResolver(joinSessionSchema),
    defaultValues: {
      code: '',
    },
  })

  const handleJoinSession = (data: JoinSessionForm) => {
    try {
      loadSessionByCode(data.code)
      // navigate to session route
      router.push(`/session/${data.code}`)
    } catch (error) {
      toast.error('Failed to join session', {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <div className="flex flex-col items-center space-y-8 p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-bold">Connect to a session</h1>
        <p className="text-muted-foreground">
          Enter the code to join an existing planning session
        </p>
      </div>

      <div className="w-full max-w-sm space-y-12">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleJoinSession)}
            className="gap-4 flex flex-col"
          >
            <fieldset>
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session code</FormLabel>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={value => field.onChange(value.toUpperCase())}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={0}
                            className="w-14 h-14 text-xl font-bold"
                          />
                          <InputOTPSlot
                            index={1}
                            className="w-14 h-14 text-xl font-bold"
                          />
                          <InputOTPSlot
                            index={2}
                            className="w-14 h-14 text-xl font-bold"
                          />
                        </InputOTPGroup>
                        <InputOTPSeparator className="px-1" />
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={3}
                            className="w-14 h-14 text-xl font-bold"
                          />
                          <InputOTPSlot
                            index={4}
                            className="w-14 h-14 text-xl font-bold"
                          />
                          <InputOTPSlot
                            index={5}
                            className="w-14 h-14 text-xl font-bold"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
            <fieldset>
              <Button
                disabled={!form.formState.isValid}
                className="w-full"
                size="lg"
              >
                Join session
              </Button>
            </fieldset>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground capitalize">
              or
            </span>
          </div>
        </div>

        <CreateSessionDialog />
      </div>

      <section className="w-full grid grid-cols-6 gap-4">
        <h2 className="text-lg text-start col-span-6 font-bold mt-12">
          Your recent sessions
        </h2>
        {Object.values(sessions)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 6)
          .map(session => (
            <Card
              key={session.code}
              className="lg:col-span-2 md:col-span-3 col-span-6"
            >
              <CardHeader>
                <CardTitle>{session.name}</CardTitle>
                <CardDescription>
                  Session code: {sessionIdToReadableFormat(session.code)}
                </CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleJoinSession({ code: session.code })}
                  >
                    Go to session
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
      </section>
    </div>
  )
}

const createSessionSchema = PlanningSessionSchema.pick({
  name: true,
})
type CreateSessionForm = z.infer<typeof createSessionSchema>

const sessionNamePlaceholders = [
  'Q1 Sprint 3',
  'User Authentication',
  'Payment Integration',
  'Mobile App Features',
  'E-commerce Platform',
  'API Performance',
  'Dashboard Development',
  'Search Functionality',
  'Notification System',
  'Admin Panel',
]

function CreateSessionDialog() {
  const [isCreating, setIsCreating] = useState(false)
  const { next, prev } = useStepper()
  const router = useRouter()
  const { createSession } = usePlanningStore()

  const form = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      name: '',
    },
  })

  const sessionNamePlaceholder = useMemo(
    () => getRandomItem(sessionNamePlaceholders),
    [isCreating]
  )

  const handleCreateSession = (data: CreateSessionForm) => {
    const sessionCode = generateSessionId()
    try {
      next() // Already show the next step
      createSession(data.name, sessionCode)
      form.reset()
      router.push(`/session/${sessionCode}`)
    } catch (error) {
      prev()
      toast.error('Failed to create session', {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <Dialog
      open={isCreating}
      onOpenChange={open => {
        if (open) return
        setIsCreating(false)
        form.reset()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => setIsCreating(true)}
        >
          Create new session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new session</DialogTitle>
          <DialogDescription>
            Kick off a collaborative planning session with your team to estimate
            story points and plan your next sprint with confidence.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreateSession)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session name</FormLabel>
                  <FormDescription>
                    E.g., Sprint 3, User Authentication, Payment Integration,
                    etc.
                  </FormDescription>
                  <FormControl>
                    <Input placeholder={sessionNamePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Create session
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function SessionActions() {
  return null
}
