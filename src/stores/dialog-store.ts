import { create } from 'zustand'
import type { Story } from '@/types'

export type DialogMode = 'add' | 'edit'

export interface DialogStore {
  // Story Dialog
  isStoryDialogOpen: boolean
  dialogMode: DialogMode
  storyToEdit: Story | null

  // Actions
  openAddStoryDialog: () => void
  openEditStoryDialog: (story: Story) => void
  closeStoryDialog: () => void
  resetStoryDialog: () => void
}

export const useDialogStore = create<DialogStore>(set => ({
  // Story Dialog
  isStoryDialogOpen: false,
  dialogMode: 'add',
  storyToEdit: null,

  // Actions
  openAddStoryDialog: () =>
    set({
      isStoryDialogOpen: true,
      dialogMode: 'add',
      storyToEdit: null,
    }),

  openEditStoryDialog: (story: Story) =>
    set({
      isStoryDialogOpen: true,
      dialogMode: 'edit',
      storyToEdit: story,
    }),

  closeStoryDialog: () =>
    set({
      isStoryDialogOpen: false,
      dialogMode: 'add',
      storyToEdit: null,
    }),

  resetStoryDialog: () =>
    set({
      dialogMode: 'add',
      storyToEdit: null,
    }),
}))
