'use client'

import React from 'react'
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
  React.useEffect(() => {
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

  const isEditMode = dialogMode === 'edit'
  const dialogTitle = isEditMode ? 'Edit Story' : 'Add New Story'
  const dialogDescription = isEditMode
    ? 'Update the details of your user story.'
    : 'Create a new user story for your planning session. Fill in the details below.'
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
                  <FormControl>
                    <Input
                      placeholder="Enter story title..."
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
                  <FormControl>
                    <Textarea
                      placeholder="Enter story description..."
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
