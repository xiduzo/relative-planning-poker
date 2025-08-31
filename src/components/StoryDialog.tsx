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
import { useDialogStore } from '@/stores/dialog-store'
import { usePlanningStore } from '@/stores/planning-store'
import {
  CreateStoryInputSchema,
  STORY_TITLE_MAX_LENGTH,
  STORY_DESCRIPTION_MAX_LENGTH,
} from '@/types'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const formSchema = CreateStoryInputSchema

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
  const { addStory, updateStory, deleteStory } = usePlanningStore()

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
      if (dialogMode === 'add') {
        addStory(data)
      } else if (dialogMode === 'edit' && storyToEdit) {
        updateStory(storyToEdit.id, data)
      }
      form.reset()
      closeStoryDialog()
    } catch (error) {
      console.error('Failed to save story:', error)
      // You could add toast notification here
    }
  }

  const handleDelete = () => {
    if (dialogMode === 'edit' && storyToEdit) {
      try {
        deleteStory(storyToEdit.id)
        closeStoryDialog()
      } catch (error) {
        // console.error('Failed to delete story:', error)
        toast.error('Failed to delete story')
      }
    }
  }

  const handleCancel = () => {
    form.reset()
    closeStoryDialog()
  }

  const titlePlaceholder = useMemo(() => {
    return titlePlaceholders[
      Math.floor(Math.random() * titlePlaceholders.length)
    ]
  }, [isStoryDialogOpen])

  const descriptionPlaceholder = useMemo(() => {
    return descriptionPlaceholders[
      Math.floor(Math.random() * descriptionPlaceholders.length)
    ]
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
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
