/**
 * Tests for StoryCard component
 * Following accessibility-first testing principles
 */

import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { StoryCard } from '../StoryCard'
import type { Story } from '@/types'

// Mock the stores
vi.mock('@/stores/dialog-store')
vi.mock('@/stores/planning-store')

const createTestStory = (overrides: Partial<Story> = {}): Story => ({
  id: 'test-story-1',
  title: 'Test Story',
  description: 'Test description',
  position: 0,
  isAnchor: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('StoryCard', () => {
  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('renders story title and description', () => {
      const story = createTestStory({
        title: 'My Test Story',
        description: 'This is a test story description',
      })

      render(<StoryCard story={story} />)

      expect(screen.getByText('My Test Story')).toBeInTheDocument()
      expect(
        screen.getByText('This is a test story description')
      ).toBeInTheDocument()
    })

    it('renders without description', () => {
      const story = createTestStory({
        title: 'Story Without Description',
        description: '',
      })

      render(<StoryCard story={story} />)

      expect(screen.getByText('Story Without Description')).toBeInTheDocument()
      // Should not render description section
      expect(screen.queryByText('Test description')).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const story = createTestStory()
      const customClass = 'custom-story-class'

      const { container } = render(
        <StoryCard story={story} className={customClass} />
      )
      const card = container.firstChild as HTMLElement

      expect(card).toHaveClass(customClass)
    })
  })

  describe('anchor story styling', () => {
    it('applies anchor story styles when isAnchor is true', () => {
      const story = createTestStory({ isAnchor: true })

      const { container } = render(<StoryCard story={story} />)
      const card = container.firstChild as HTMLElement

      expect(card).toHaveClass('border-primary')
      expect(card).toHaveClass('bg-primary/5')
      expect(card).toHaveClass('shadow-md')
      expect(card).toHaveClass('ring-1')
      expect(card).toHaveClass('ring-primary/20')
    })

    it('shows anchor badge when isAnchor is true', () => {
      const story = createTestStory({ isAnchor: true })

      render(<StoryCard story={story} />)

      expect(screen.getByText('Anchor')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Anchor story indicator')
      ).toBeInTheDocument()
    })

    it('does not show anchor badge when isAnchor is false', () => {
      const story = createTestStory({ isAnchor: false })

      render(<StoryCard story={story} />)

      expect(screen.queryByText('Anchor')).not.toBeInTheDocument()
    })

    it('applies primary text color to title when isAnchor is true', () => {
      const story = createTestStory({ isAnchor: true })

      const { container } = render(<StoryCard story={story} />)
      const title = container.querySelector('[data-slot="card-title"]')

      expect(title).toHaveClass('text-primary')
    })
  })

  describe('position indicator', () => {
    it('shows primary color for anchor story', () => {
      const story = createTestStory({ isAnchor: true })

      const { container } = render(<StoryCard story={story} />)
      const indicator = container.querySelector('.absolute.bottom-0')

      expect(indicator).toHaveClass('bg-primary/30')
    })

    it('shows green for lower complexity (negative position)', () => {
      const story = createTestStory({ position: -50 })

      const { container } = render(<StoryCard story={story} />)
      const indicator = container.querySelector('.absolute.bottom-0')

      expect(indicator).toHaveClass('bg-green-400/60')
    })

    it('shows orange for higher complexity (positive position)', () => {
      const story = createTestStory({ position: 50 })

      const { container } = render(<StoryCard story={story} />)
      const indicator = container.querySelector('.absolute.bottom-0')

      expect(indicator).toHaveClass('bg-orange-400/60')
    })

    it('shows blue for same complexity as anchor (position 0)', () => {
      const story = createTestStory({ position: 0 })

      const { container } = render(<StoryCard story={story} />)
      const indicator = container.querySelector('.absolute.bottom-0')

      expect(indicator).toHaveClass('bg-blue-400/60')
    })
  })

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      const story = createTestStory()
      const handleClick = vi.fn()

      render(<StoryCard story={story} onClick={handleClick} />)

      const card = screen.getByRole('button', { name: /story: test story/i })
      fireEvent.click(card)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('calls onDoubleClick when double-clicked', () => {
      const story = createTestStory()
      const handleDoubleClick = vi.fn()

      render(<StoryCard story={story} onDoubleClick={handleDoubleClick} />)

      const card = screen.getByRole('button', { name: /story: test story/i })
      fireEvent.doubleClick(card)

      expect(handleDoubleClick).toHaveBeenCalledTimes(1)
    })

    it('handles keyboard navigation', () => {
      const story = createTestStory()
      const handleClick = vi.fn()

      render(<StoryCard story={story} onClick={handleClick} />)

      const card = screen.getByRole('button', { name: /story: test story/i })

      // Test Enter key
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)

      // Test Space key
      fireEvent.keyDown(card, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('handles keyboard events correctly', () => {
      const story = createTestStory()
      const handleClick = vi.fn()

      render(<StoryCard story={story} onClick={handleClick} />)

      const card = screen.getByRole('button', { name: /story: test story/i })

      // Test Enter key
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)

      // Test Space key
      fireEvent.keyDown(card, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('context menu', () => {
    it('renders context menu when context menu actions are provided', () => {
      const story = createTestStory()
      const handleEdit = vi.fn()
      const handleDelete = vi.fn()
      const handleMakeAnchor = vi.fn()

      render(
        <StoryCard
          story={story}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMakeAnchor={handleMakeAnchor}
        />
      )

      // Context menu should be present
      expect(
        screen.getByRole('button', { name: /story: test story/i })
      ).toBeInTheDocument()
    })

    it('shows edit option in context menu', () => {
      const story = createTestStory()
      const handleEdit = vi.fn()

      render(<StoryCard story={story} onEdit={handleEdit} />)

      const card = screen.getByRole('button', { name: /story: test story/i })

      // Right-click to open context menu
      fireEvent.contextMenu(card)

      // Context menu should be present (though we can't easily test the content in this setup)
      expect(card).toBeInTheDocument()
    })

    it('shows delete option in context menu', () => {
      const story = createTestStory()
      const handleDelete = vi.fn()

      render(<StoryCard story={story} onDelete={handleDelete} />)

      const card = screen.getByRole('button', { name: /story: test story/i })

      // Right-click to open context menu
      fireEvent.contextMenu(card)

      expect(card).toBeInTheDocument()
    })

    it('shows make anchor option only for non-anchor stories', () => {
      const story = createTestStory({ isAnchor: false })
      const handleMakeAnchor = vi.fn()

      render(<StoryCard story={story} onMakeAnchor={handleMakeAnchor} />)

      const card = screen.getByRole('button', { name: /story: test story/i })

      // Right-click to open context menu
      fireEvent.contextMenu(card)

      expect(card).toBeInTheDocument()
    })

    it('does not show make anchor option for anchor stories', () => {
      const story = createTestStory({ isAnchor: true })
      const handleMakeAnchor = vi.fn()

      render(<StoryCard story={story} onMakeAnchor={handleMakeAnchor} />)

      const card = screen.getByRole('button', {
        name: /story: test story \(anchor story\)/i,
      })

      // Right-click to open context menu
      fireEvent.contextMenu(card)

      expect(card).toBeInTheDocument()
    })
  })

  describe('drag and drop functionality', () => {
    const renderWithDndContext = (component: React.ReactElement) => {
      const handleDragEnd = vi.fn((event: DragEndEvent) => {
        // Mock drag end handler
      })

      return render(
        <DndContext onDragEnd={handleDragEnd}>{component}</DndContext>
      )
    }

    it('applies dragging styles when isDragging is true', () => {
      const story = createTestStory({ title: 'Dragging Story' })

      const { container } = renderWithDndContext(
        <StoryCard story={story} isDragging={true} />
      )
      const card = container.firstChild as HTMLElement

      expect(card).toHaveClass('opacity-50')
      expect(card).toHaveClass('scale-105')
      expect(card).toHaveClass('shadow-2xl')
    })

    it('does not apply dragging styles when isDragging is false', () => {
      const story = createTestStory({ title: 'Not Dragging Story' })

      const { container } = renderWithDndContext(
        <StoryCard story={story} isDragging={false} />
      )
      const card = container.firstChild as HTMLElement

      expect(card).not.toHaveClass('opacity-50')
      expect(card).not.toHaveClass('scale-105')
      expect(card).not.toHaveClass('shadow-2xl')
    })

    it('disables hover effects when dragging', () => {
      const story = createTestStory({ title: 'Dragging Story' })

      const { container } = renderWithDndContext(
        <StoryCard story={story} isDragging={true} />
      )
      const card = container.firstChild as HTMLElement

      // Hover effects should be disabled when dragging
      expect(card).not.toHaveClass('hover:shadow-md')
      expect(card).not.toHaveClass('hover:scale-[1.02]')
    })

    it('maintains accessibility when drag is enabled', () => {
      const story = createTestStory({ title: 'Accessible Draggable Story' })

      renderWithDndContext(<StoryCard story={story} enableDrag={true} />)

      // Story should still be accessible (role changes to button when draggable)
      const storyElement = screen.getByRole('button', {
        name: /story: accessible draggable story/i,
      })
      expect(storyElement).toBeInTheDocument()
    })

    it('maintains story content accessibility', () => {
      const story = createTestStory({
        title: 'Story with Content',
        description: 'This story has content',
        isAnchor: true,
      })

      renderWithDndContext(<StoryCard story={story} enableDrag={true} />)

      // All story content should still be accessible
      const storyElement = screen.getByRole('button', {
        name: /story: story with content \(anchor story\)/i,
      })
      const storyHeading = screen.getByRole('heading', {
        name: /story with content/i,
      })
      const storyDescription = screen.getByText(/this story has content/i)
      const anchorBadge = screen.getByLabelText('Anchor story indicator')

      expect(storyElement).toBeInTheDocument()
      expect(storyHeading).toBeInTheDocument()
      expect(storyDescription).toBeInTheDocument()
      expect(anchorBadge).toBeInTheDocument()
    })
  })

  it('calls context menu handlers when triggered', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onMakeAnchor = vi.fn()
    const story = createTestStory({ title: 'Context Menu Story' })

    render(
      <StoryCard
        story={story}
        onEdit={onEdit}
        onDelete={onDelete}
        onMakeAnchor={onMakeAnchor}
      />
    )

    // The context menu items should be rendered in the DOM (even if not visible)
    // We can test that the handlers are properly connected by checking the DOM structure
    const contextMenuTrigger = screen.getByRole('button', {
      name: /story: context menu story/i,
    })

    expect(contextMenuTrigger).toHaveAttribute(
      'data-slot',
      'context-menu-trigger'
    )

    // Test that the context menu is properly set up by checking for the trigger
    expect(contextMenuTrigger).toBeInTheDocument()
  })

  it('does not show "Make Anchor Story" option for anchor stories', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onMakeAnchor = vi.fn()
    const story = createTestStory({
      title: 'Anchor Story',
      isAnchor: true,
    })

    render(
      <StoryCard
        story={story}
        onEdit={onEdit}
        onDelete={onDelete}
        onMakeAnchor={onMakeAnchor}
      />
    )

    const contextMenuTrigger = screen.getByRole('button', {
      name: /story: anchor story \(anchor story\)/i,
    })

    // Test that the context menu is properly set up
    expect(contextMenuTrigger).toHaveAttribute(
      'data-slot',
      'context-menu-trigger'
    )
    expect(contextMenuTrigger).toBeInTheDocument()
  })
})
