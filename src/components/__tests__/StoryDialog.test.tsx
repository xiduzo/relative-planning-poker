import React from 'react'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StoryDialog } from '../StoryDialog'
import { useDialogStore } from '@/stores/dialog-store'
import { usePlanningStore } from '@/stores/planning-store'
import type { Story } from '@/types'

// Mock the stores
vi.mock('@/stores/dialog-store')
vi.mock('@/stores/planning-store')

const mockUseDialogStore = vi.mocked(useDialogStore)
const mockUsePlanningStore = vi.mocked(usePlanningStore)

const mockStory: Story = {
  id: 'test-story-1',
  title: 'Test Story',
  description: 'Test description',
  position: 0,
  isAnchor: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('StoryDialog', () => {
  const mockCloseStoryDialog = vi.fn()
  const mockAddStory = vi.fn()
  const mockUpdateStory = vi.fn()
  const mockDeleteStory = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseDialogStore.mockReturnValue({
      isStoryDialogOpen: true,
      dialogMode: 'add',
      storyToEdit: null,
      openAddStoryDialog: vi.fn(),
      openEditStoryDialog: vi.fn(),
      closeStoryDialog: mockCloseStoryDialog,
      resetStoryDialog: vi.fn(),
    })

    mockUsePlanningStore.mockReturnValue({
      currentSession: {
        id: 'test-session',
        name: 'Test Session',
        stories: [],
        anchorStoryId: null,
        pointCutoffs: [],
        isPointAssignmentMode: false,
        createdAt: new Date(),
        lastModified: new Date(),
      },
      addStory: mockAddStory,
      updateStory: mockUpdateStory,
      deleteStory: mockDeleteStory,
      createSession: vi.fn(),
      loadSession: vi.fn(),
      clearSession: vi.fn(),
      updateStoryPosition: vi.fn(),
      setAnchorStory: vi.fn(),
      togglePointAssignmentMode: vi.fn(),
      updatePointCutoffs: vi.fn(),
      exportResults: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
  })

  describe('Add Mode', () => {
    it('should render dialog in add mode', () => {
      render(<StoryDialog />)

      expect(screen.getByText('Add New Story')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Create a new user story for your planning session. Fill in the details below.'
        )
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Add Story' })
      ).toBeInTheDocument()
    })

    it('should not show delete button in add mode', () => {
      render(<StoryDialog />)

      expect(
        screen.queryByRole('button', { name: 'Delete' })
      ).not.toBeInTheDocument()
    })

    it('should submit form to add story', async () => {
      render(<StoryDialog />)

      const titleInput = screen.getByLabelText('Title')
      const descriptionInput = screen.getByLabelText('Description')
      const submitButton = screen.getByRole('button', { name: 'Add Story' })

      fireEvent.change(titleInput, { target: { value: 'New Story' } })
      fireEvent.change(descriptionInput, {
        target: { value: 'New description' },
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddStory).toHaveBeenCalledWith({
          title: 'New Story',
          description: 'New description',
        })
        expect(mockCloseStoryDialog).toHaveBeenCalled()
      })
    })
  })

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockUseDialogStore.mockReturnValue({
        isStoryDialogOpen: true,
        dialogMode: 'edit',
        storyToEdit: mockStory,
        openAddStoryDialog: vi.fn(),
        openEditStoryDialog: vi.fn(),
        closeStoryDialog: mockCloseStoryDialog,
        resetStoryDialog: vi.fn(),
      })
    })

    it('should render dialog in edit mode', () => {
      render(<StoryDialog />)

      expect(screen.getByText('Edit Story')).toBeInTheDocument()
      expect(
        screen.getByText('Update the details of your user story.')
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Update Story' })
      ).toBeInTheDocument()
    })

    it('should show delete button in edit mode', () => {
      render(<StoryDialog />)

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    it('should pre-fill form with story data', () => {
      render(<StoryDialog />)

      const titleInput = screen.getByLabelText('Title') as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        'Description'
      ) as HTMLTextAreaElement

      expect(titleInput.value).toBe('Test Story')
      expect(descriptionInput.value).toBe('Test description')
    })

    it('should submit form to update story', async () => {
      render(<StoryDialog />)

      const titleInput = screen.getByLabelText('Title')
      const descriptionInput = screen.getByLabelText('Description')
      const submitButton = screen.getByRole('button', { name: 'Update Story' })

      fireEvent.change(titleInput, { target: { value: 'Updated Story' } })
      fireEvent.change(descriptionInput, {
        target: { value: 'Updated description' },
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateStory).toHaveBeenCalledWith('test-story-1', {
          title: 'Updated Story',
          description: 'Updated description',
        })
        expect(mockCloseStoryDialog).toHaveBeenCalled()
      })
    })

    it('should delete story when delete button is clicked', () => {
      render(<StoryDialog />)

      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      expect(mockDeleteStory).toHaveBeenCalledWith('test-story-1')
      expect(mockCloseStoryDialog).toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<StoryDialog />)

      const submitButton = screen.getByRole('button', { name: 'Add Story' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Story title is required')).toBeInTheDocument()
      })
    })
  })

  describe('Dialog Actions', () => {
    it('should close dialog when cancel is clicked', () => {
      render(<StoryDialog />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(mockCloseStoryDialog).toHaveBeenCalled()
    })

    it('should not render dialog when closed', () => {
      mockUseDialogStore.mockReturnValue({
        isStoryDialogOpen: false,
        dialogMode: 'add',
        storyToEdit: null,
        openAddStoryDialog: vi.fn(),
        openEditStoryDialog: vi.fn(),
        closeStoryDialog: mockCloseStoryDialog,
        resetStoryDialog: vi.fn(),
      })

      render(<StoryDialog />)

      expect(screen.queryByText('Add New Story')).not.toBeInTheDocument()
    })
  })
})
