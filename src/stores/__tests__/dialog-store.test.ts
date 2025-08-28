import { describe, it, expect, beforeEach } from 'vitest'
import { useDialogStore } from '../dialog-store'
import type { Story } from '@/types'

const mockStory: Story = {
  id: 'test-story-1',
  title: 'Test Story',
  description: 'Test description',
  position: { x: 0, y: 0 },
  isAnchor: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('DialogStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useDialogStore.setState({
      isStoryDialogOpen: false,
      dialogMode: 'add',
      storyToEdit: null,
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useDialogStore.getState()
      expect(state.isStoryDialogOpen).toBe(false)
      expect(state.dialogMode).toBe('add')
      expect(state.storyToEdit).toBe(null)
    })
  })

  describe('openAddStoryDialog', () => {
    it('should set dialog to add mode and open it', () => {
      const { openAddStoryDialog } = useDialogStore.getState()
      openAddStoryDialog()

      const state = useDialogStore.getState()
      expect(state.isStoryDialogOpen).toBe(true)
      expect(state.dialogMode).toBe('add')
      expect(state.storyToEdit).toBe(null)
    })
  })

  describe('openEditStoryDialog', () => {
    it('should set dialog to edit mode, set story to edit, and open it', () => {
      const { openEditStoryDialog } = useDialogStore.getState()
      openEditStoryDialog(mockStory)

      const state = useDialogStore.getState()
      expect(state.isStoryDialogOpen).toBe(true)
      expect(state.dialogMode).toBe('edit')
      expect(state.storyToEdit).toBe(mockStory)
    })
  })

  describe('closeStoryDialog', () => {
    it('should close dialog and reset to add mode', () => {
      // First open the dialog in edit mode
      const { openEditStoryDialog, closeStoryDialog } =
        useDialogStore.getState()
      openEditStoryDialog(mockStory)

      // Then close it
      closeStoryDialog()

      const state = useDialogStore.getState()
      expect(state.isStoryDialogOpen).toBe(false)
      expect(state.dialogMode).toBe('add')
      expect(state.storyToEdit).toBe(null)
    })
  })

  describe('resetStoryDialog', () => {
    it('should reset dialog mode and story to edit without closing', () => {
      // First open the dialog in edit mode
      const { openEditStoryDialog, resetStoryDialog } =
        useDialogStore.getState()
      openEditStoryDialog(mockStory)

      // Then reset it
      resetStoryDialog()

      const state = useDialogStore.getState()
      expect(state.isStoryDialogOpen).toBe(true) // Should still be open
      expect(state.dialogMode).toBe('add')
      expect(state.storyToEdit).toBe(null)
    })
  })
})
