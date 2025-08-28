'use client'

import { useState } from 'react'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { usePlanningStore } from '@/stores/planning-store'
import { generateSessionId } from '@/utils/id'
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

const joinSessionSchema = PlanningSessionSchema.pick({
  code: true,
})
type JoinSessionForm = z.infer<typeof joinSessionSchema>

export function Session() {
  const { loadSessionByCode, currentSession, sessions } = usePlanningStore()

  // Form for creating new session
  const form = useForm<JoinSessionForm>({
    resolver: zodResolver(joinSessionSchema),
    defaultValues: {
      code: '',
    },
  })

  const handleJoinSession = () => {}

  return (
    <div className="flex flex-col items-center space-y-8 p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-bold">Join a Planning Session</h1>
        <p className="text-muted-foreground">
          Enter the session code to join an existing planning session
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
                        onChange={field.onChange}
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
                onClick={handleJoinSession}
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

      <section className="w-full grid grid-cols-3 gap-4">
        <h2 className="text-lg text-start col-span-3 font-bold mt-12">
          Your recent sessions
        </h2>
        {Object.values(sessions)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .slice(0, 6)
          .map(session => (
            <Card key={session.id} className="col-span-1">
              <CardHeader>
                <CardTitle>{session.name}</CardTitle>
                <CardDescription>Session code: {session.code}</CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => loadSessionByCode(session.code)}
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

function CreateSessionDialog() {
  const [isCreating, setIsCreating] = useState(false)
  const { next } = useStepper()

  const { createSession } = usePlanningStore()

  const form = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      name: '',
    },
  })

  const handleCreateSession = (data: CreateSessionForm) => {
    const sessionCode = generateSessionId()
    try {
      createSession(data.name, sessionCode)
      form.reset()
      //   next()
    } catch (error) {
      console.error(error)
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
                  <FormControl>
                    <Input placeholder="Enter session name" {...field} />
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
