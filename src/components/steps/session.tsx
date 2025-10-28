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
import { useStepper } from './main-stepper'
import { toast } from 'sonner'
import { getErrorMessage } from '@/utils'
import { useRouter } from 'next/navigation'
import { getRandomItem } from '@/utils/array'
import { useCreateSession } from '@/hooks/use-session'

const joinSessionSchema = z.object({
  code: z.string().min(6).max(6),
})
type JoinSessionForm = z.infer<typeof joinSessionSchema>

export function Session() {
  const router = useRouter()
  const form = useForm<JoinSessionForm>({
    resolver: zodResolver(joinSessionSchema),
    defaultValues: {
      code: '',
    },
  })

  const handleJoinSession = (data: JoinSessionForm) => {
    // Navigate to session route - the session will be loaded there
    router.push(`/session/${data.code}`)
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
          Recent sessions
        </h2>
        <p className="text-muted-foreground col-span-6">
          Sessions are now stored in the database. Use the session code to join
          any session.
        </p>
      </section>
    </div>
  )
}

const createSessionSchema = z.object({
  name: z.string().min(3),
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
  const { setCurrentSession } = usePlanningStore()
  const createSessionMutation = useCreateSession()

  const form = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      name: '',
    },
  })

  const sessionNamePlaceholder = useMemo(() => {
    if (isCreating) return getRandomItem(sessionNamePlaceholders)
    return ''
  }, [isCreating])

  const handleCreateSession = async (data: CreateSessionForm) => {
    try {
      next() // Already show the next step
      const session = await createSessionMutation.mutateAsync(data.name)
      if (!session) throw new Error('Failed to create session')
      setCurrentSession(session.code)
      form.reset()
      router.push(`/session/${session.code}`)
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
              <Button
                type="submit"
                className="flex-1"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending
                  ? 'Creating...'
                  : 'Create session'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
                disabled={createSessionMutation.isPending}
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
