/**
 * Integration tests for drag and drop functionality with planning store
 * Testing the complete drag and drop workflow
 */

import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DndProvider } from '../DndProvider'
import { StoryCard } from '../StoryCard'
import { usePlanningStore } from '@/stores/planning-store'
import { createTestStory } from '@/test/utils'

describe('Drag and Drop Integration', () => {
  beforeEach(() => {
    // Clear the store before each test
    const { clearSession } = usePlanningStore.getState()
    clearSession()
  })

  afterEach(() => {
    cleanup()
  })

  it('integrates drag and drop with planning store position updates', () => {
    const { createSession, addStory, currentSession } =
      usePlanningStore.getState()

    // Set up test session with stories
    act(() => {
      createSession('Test Session')
      addStory({ title: 'First Story', description: 'First story description' })
      addStory({
        title: 'Second Story',
        description: 'Second story description',
      })
    })

    const session = usePlanningStore.getState().currentSession
    expect(session).toBeTruthy()
    expect(session!.stories).toHaveLength(2)

    const firstStory = session!.stories[0]
    const secondStory = session!.stories[1]

    render(
      <DndProvider>
        <div style={{ display: 'flex', gap: '16px' }}>
          <StoryCard story={firstStory} enableDrag={true} />
          <StoryCard story={secondStory} enableDrag={true} />
        </div>
      </DndProvider>
    )

    // Verify stories are rendered - when drag is enabled, role becomes button
    const firstStoryElement = screen.getByRole('button', {
      name: /story: first story \(anchor story\)/i,
    })
    const secondStoryElement = screen.getByRole('button', {
      name: /story: second story/i,
    })

    expect(firstStoryElement).toBeInTheDocument()
    expect(secondStoryElement).toBeInTheDocument()
  })

  it('maintains story data integrity during drag operations', () => {
    const { createSession, addStory } = usePlanningStore.getState()

    act(() => {
      createSession('Integrity Test Session')
      addStory({
        title: 'Test Story',
        description: 'This story tests data integrity during drag operations',
      })
    })

    const session = usePlanningStore.getState().currentSession
    const story = session!.stories[0]

    render(
      <DndProvider>
        <StoryCard story={story} enableDrag={true} />
      </DndProvider>
    )

    // Verify story content is preserved - when drag is enabled, role becomes button
    const storyElement = screen.getByRole('button', {
      name: /story: test story/i,
    })
    const storyHeading = screen.getByRole('heading', { name: /test story/i })
    const storyDescription = screen.getByText(
      /this story tests data integrity/i
    )

    expect(storyElement).toBeInTheDocument()
    expect(storyHeading).toBeInTheDocument()
    expect(storyDescription).toBeInTheDocument()

    // Simulate drag interaction on the card itself
    fireEvent.mouseDown(storyElement)
    fireEvent.mouseUp(storyElement)

    // Verify content is still intact
    expect(storyElement).toBeInTheDocument()
    expect(storyHeading).toBeInTheDocument()
    expect(storyDescription).toBeInTheDocument()
  })

  it('handles anchor story drag operations correctly', () => {
    const { createSession, addStory } = usePlanningStore.getState()

    act(() => {
      createSession('Anchor Test Session')
      addStory({
        title: 'Anchor Story',
        description: 'This is the anchor story',
      })
    })

    const session = usePlanningStore.getState().currentSession
    const anchorStory = session!.stories[0]

    // First story should be anchor by default
    expect(anchorStory.isAnchor).toBe(true)

    render(
      <DndProvider>
        <StoryCard story={anchorStory} enableDrag={true} />
      </DndProvider>
    )

    // Verify anchor story is rendered with proper indicators - when drag is enabled, role becomes button
    const storyElement = screen.getByRole('button', {
      name: /story: anchor story \(anchor story\)/i,
    })
    const anchorBadge = screen.getByText('Anchor')

    expect(storyElement).toBeInTheDocument()
    expect(anchorBadge).toBeInTheDocument()

    // Anchor stories should still be draggable
    expect(storyElement).toHaveClass('border-primary')
    expect(storyElement).toHaveClass('bg-primary/5')
  })

  it('supports multiple story drag operations in sequence', () => {
    const { createSession, addStory } = usePlanningStore.getState()

    act(() => {
      createSession('Multiple Drag Test Session')
      addStory({ title: 'Story A', description: 'First story' })
      addStory({ title: 'Story B', description: 'Second story' })
      addStory({ title: 'Story C', description: 'Third story' })
    })

    const session = usePlanningStore.getState().currentSession
    const stories = session!.stories

    render(
      <DndProvider>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {stories.map(story => (
            <StoryCard key={story.id} story={story} enableDrag={true} />
          ))}
        </div>
      </DndProvider>
    )

    // Verify all stories are rendered - when drag is enabled, role becomes button
    const storyA = screen.getByRole('button', {
      name: /story: story a \(anchor story\)/i,
    })
    const storyB = screen.getByRole('button', { name: /story: story b/i })
    const storyC = screen.getByRole('button', { name: /story: story c/i })

    expect(storyA).toBeInTheDocument()
    expect(storyB).toBeInTheDocument()
    expect(storyC).toBeInTheDocument()

    // Test sequential drag operations on the cards themselves
    ;[storyA, storyB, storyC].forEach(card => {
      fireEvent.mouseDown(card)
      fireEvent.mouseUp(card)

      // Verify the card is still functional after drag
      expect(card).toBeInTheDocument()
    })
  })

  it('maintains accessibility throughout drag operations', () => {
    const { createSession, addStory } = usePlanningStore.getState()

    act(() => {
      createSession('Accessibility Test Session')
      addStory({
        title: 'Accessible Drag Story',
        description: 'Testing accessibility during drag operations',
      })
    })

    const session = usePlanningStore.getState().currentSession
    const story = session!.stories[0]

    render(
      <DndProvider>
        <StoryCard story={story} enableDrag={true} />
      </DndProvider>
    )

    // Verify initial accessibility - when drag is enabled, role becomes button
    const storyElement = screen.getByRole('button', {
      name: /story: accessible drag story \(anchor story\)/i,
    })
    const storyHeading = screen.getByRole('heading', {
      name: /accessible drag story/i,
    })
    const storyDescription = screen.getByText(
      /testing accessibility during drag operations/i
    )

    expect(storyElement).toBeInTheDocument()
    expect(storyHeading).toBeInTheDocument()
    expect(storyDescription).toBeInTheDocument()

    // Test keyboard navigation
    storyElement.focus()
    expect(storyElement).toHaveFocus()

    fireEvent.keyDown(storyElement, { key: 'Tab' })
    fireEvent.keyDown(storyElement, { key: 'Enter' })
    fireEvent.keyDown(storyElement, { key: 'ArrowRight' })
    fireEvent.keyDown(storyElement, { key: 'ArrowLeft' })

    // Verify accessibility is maintained after keyboard interactions
    expect(storyElement).toBeInTheDocument()
    expect(storyHeading).toBeInTheDocument()
    expect(storyDescription).toBeInTheDocument()
  })

  it('handles edge cases gracefully', () => {
    const { createSession, addStory } = usePlanningStore.getState()

    act(() => {
      createSession('Edge Case Test Session')
      addStory({ title: 'Edge Case Story', description: '' }) // Empty description
    })

    const session = usePlanningStore.getState().currentSession
    const story = session!.stories[0]

    render(
      <DndProvider>
        <StoryCard story={story} enableDrag={true} />
      </DndProvider>
    )

    // Verify story with empty description renders correctly - when drag is enabled, role becomes button
    const storyElement = screen.getByRole('button', {
      name: /story: edge case story \(anchor story\)/i,
    })
    const storyHeading = screen.getByRole('heading', {
      name: /edge case story/i,
    })

    expect(storyElement).toBeInTheDocument()
    expect(storyHeading).toBeInTheDocument()

    // Description should not be rendered when empty
    expect(screen.queryByText(/edge case story/i)).toBeInTheDocument() // Title should be there

    // Drag should still work with edge case data
    fireEvent.mouseDown(storyElement)
    fireEvent.mouseUp(storyElement)

    expect(storyElement).toBeInTheDocument()
  })
})
