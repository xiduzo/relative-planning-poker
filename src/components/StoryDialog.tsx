'use client'

import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  useAddStory,
  useUpdateStory,
  useDeleteStory,
} from '@/hooks/use-session'
import { usePlanningStore } from '@/stores/planning-store'
import { STORY_TITLE_MAX_LENGTH, STORY_DESCRIPTION_MAX_LENGTH } from '@/types'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getRandomItem } from '@/utils/array'
import { getErrorMessage } from '@/utils/validation'
import { useDialogStore } from '@/stores'

const formSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const titlePlaceholders = [
  'Enter story title...',
  'PROJ-123: User authentication',
  'Feature: Shopping cart',
  'Bug: Login page crash',
  'Epic: Payment integration',
  'Task: Update user profile',
  'Story: Email notifications',
  'Ticket: API rate limiting',
]

const descriptionPlaceholders = [
  'Enter story description...',
  'As a user, I want to be able to log in so that I can access my account.',
  'As a customer, I want to add items to my cart so that I can purchase them.',
  'As an admin, I want to view user statistics so that I can monitor activity.',
  'As a developer, I want to receive notifications so that I know when builds fail.',
  'As a user, I want to reset my password so that I can regain access if I forget it.',
  'As a customer, I want to save my payment methods so that I can checkout faster.',
  'As a manager, I want to generate reports so that I can track team performance.',
]

export function StoryDialog() {
  const { isStoryDialogOpen, dialogMode, storyToEdit, closeStoryDialog } =
    useDialogStore()
  const { currentSession } = usePlanningStore()
  const addStoryMutation = useAddStory()
  const updateStoryMutation = useUpdateStory()
  const deleteStoryMutation = useDeleteStory()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  // Update form when storyToEdit changes
  useEffect(() => {
    if (storyToEdit && dialogMode === 'edit') {
      form.reset({
        title: storyToEdit.title,
        description: storyToEdit.description,
      })
    } else {
      form.reset({
        title: '',
        description: '',
      })
    }
  }, [storyToEdit, dialogMode, form])

  const onSubmit = (data: FormData) => {
    try {
      if (dialogMode === 'add' && currentSession) {
        addStoryMutation.mutateAsync({
          sessionId: currentSession.id,
          input: {
            description: '',
            ...data,
          },
        })
      } else if (dialogMode === 'edit' && storyToEdit) {
        updateStoryMutation.mutateAsync({
          storyId: storyToEdit.id,
          updates: data,
        })
      }
      form.reset()
      closeStoryDialog()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save story', {
        description: getErrorMessage(error),
      })
    }
  }

  const handleDelete = async () => {
    if (dialogMode === 'edit' && storyToEdit) {
      try {
        await deleteStoryMutation.mutateAsync(storyToEdit.id)
        closeStoryDialog()
      } catch (error) {
        console.error(error)
        toast.error('Failed to delete story')
      }
    }
  }

  const handleCancel = () => {
    form.reset()
    closeStoryDialog()
  }

  const titlePlaceholder = useMemo(() => {
    if (isStoryDialogOpen) return getRandomItem(titlePlaceholders)
    return ''
  }, [isStoryDialogOpen])
  const descriptionPlaceholder = useMemo(() => {
    if (isStoryDialogOpen) return getRandomItem(descriptionPlaceholders)
    return ''
  }, [isStoryDialogOpen])

  const isEditMode = dialogMode === 'edit'
  const dialogTitle = isEditMode ? 'Edit story' : 'Add new story'
  const dialogDescription = isEditMode
    ? 'Update the details of your user story.'
    : 'Create a new user story for your planning session.'
  const submitButtonText = isEditMode ? 'Update Story' : 'Add Story'

  return (
    <Dialog open={isStoryDialogOpen} onOpenChange={closeStoryDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormDescription>
                    E.g., Ticket number, Feature name or other identifier.
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder={titlePlaceholder}
                      {...field}
                      maxLength={STORY_TITLE_MAX_LENGTH}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormDescription>
                    E.g., What is the user story? What is the expected behavior?
                    What is the expected result?
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={descriptionPlaceholder}
                      className="resize-none"
                      {...field}
                      maxLength={STORY_DESCRIPTION_MAX_LENGTH}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="gap-2"
                  disabled={deleteStoryMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteStoryMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  addStoryMutation.isPending ||
                  updateStoryMutation.isPending
                }
              >
                {form.formState.isSubmitting ||
                addStoryMutation.isPending ||
                updateStoryMutation.isPending
                  ? 'Saving...'
                  : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
