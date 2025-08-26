/**
 * Tests for StoryCard component
 * Following accessibility-first testing principles
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { StoryCard } from '../StoryCard';
import { createTestStory } from '@/test/utils';

describe(StoryCard.name, () => {
  afterEach(() => {
    cleanup();
  });

  describe('content rendering', () => {
    it('renders story as an accessible article with heading and description', () => {
      const story = createTestStory({
        title: 'User Authentication',
        description: 'Implement login and registration functionality'
      });

      render(<StoryCard story={story} />);

      // Use semantic queries - when drag is enabled by default, role becomes button
      const storyElement = screen.getByRole('button', { name: /story: user authentication/i });
      const storyHeading = screen.getByRole('heading', { name: /user authentication/i });
      const storyDescription = screen.getByText(/implement login and registration functionality/i);

      expect(storyElement).toBeInTheDocument();
      expect(storyHeading).toBeInTheDocument();
      expect(storyDescription).toBeInTheDocument();
    });

    it('renders story without description when description is empty', () => {
      const story = createTestStory({
        title: 'Simple Story',
        description: ''
      });

      render(<StoryCard story={story} />);

      // Use semantic queries - when drag is enabled by default, role becomes button
      const storyElement = screen.getByRole('button', { name: /story: simple story/i });
      const storyHeading = screen.getByRole('heading', { name: /simple story/i });

      expect(storyElement).toBeInTheDocument();
      expect(storyHeading).toBeInTheDocument();
      
      // Verify description is not rendered
      expect(screen.queryByText(/implement/i)).not.toBeInTheDocument();
    });
  });

  describe('anchor story indicators', () => {
    it('identifies anchor stories with accessible label and badge', () => {
      const anchorStory = createTestStory({
        title: 'Anchor Story',
        isAnchor: true
      });

      render(<StoryCard story={anchorStory} />);

      // Use accessible queries - when drag is enabled by default, role becomes button
      const storyElement = screen.getByRole('button', { name: /story: anchor story \(anchor story\)/i });
      const anchorBadge = screen.getByText('Anchor');
      const storyHeading = screen.getByRole('heading', { name: /anchor story/i });

      expect(storyElement).toBeInTheDocument();
      expect(anchorBadge).toBeInTheDocument();
      expect(storyHeading).toBeInTheDocument();
    });

    it('does not show anchor indicators for regular stories', () => {
      const regularStory = createTestStory({
        title: 'Regular Story',
        isAnchor: false
      });

      render(<StoryCard story={regularStory} />);

      // Use accessible queries - when drag is enabled by default, role becomes button
      const storyElement = screen.getByRole('button', { name: /story: regular story$/i });
      const storyHeading = screen.getByRole('heading', { name: /regular story/i });

      expect(storyElement).toBeInTheDocument();
      expect(storyHeading).toBeInTheDocument();
      expect(screen.queryByText('Anchor')).not.toBeInTheDocument();
    });
  });

  it('applies anchor styling for anchor stories', () => {
    const anchorStory = createTestStory({
      title: 'Anchor Story',
      isAnchor: true
    });

    const { container } = render(<StoryCard story={anchorStory} />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('border-primary');
    expect(card).toHaveClass('bg-primary/5');
  });

  it('applies regular styling for non-anchor stories', () => {
    const regularStory = createTestStory({
      title: 'Regular Story',
      isAnchor: false
    });

    const { container } = render(<StoryCard story={regularStory} />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('border-border');
    expect(card).toHaveClass('bg-card');
  });

  describe('user interactions', () => {
    it('allows users to click on story cards', () => {
      const handleClick = vi.fn();
      const story = createTestStory({ title: 'Clickable Story' });

      render(<StoryCard story={story} onClick={handleClick} />);

      // Use accessible query - when drag is enabled by default, role becomes button
      const storyElement = screen.getByRole('button', { name: /story: clickable story/i });

      fireEvent.click(storyElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('allows users to double-click on story cards', () => {
      const handleDoubleClick = vi.fn();
      const story = createTestStory({ title: 'Double-clickable Story' });

      render(<StoryCard story={story} onDoubleClick={handleDoubleClick} />);

      // Use accessible query - when drag is enabled by default, role becomes button
      const storyElement = screen.getByRole('button', { name: /story: double-clickable story/i });

      fireEvent.doubleClick(storyElement);
      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation with Enter key', () => {
      const handleClick = vi.fn();
      const story = createTestStory({ title: 'Keyboard Accessible Story' });

      render(<StoryCard story={story} onClick={handleClick} />);

      const storyElement = screen.getByRole('button', { name: /story: keyboard accessible story/i });

      // Test keyboard interaction
      fireEvent.keyDown(storyElement, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation with Space key', () => {
      const handleClick = vi.fn();
      const story = createTestStory({ title: 'Space Key Story' });

      render(<StoryCard story={story} onClick={handleClick} />);

      const storyElement = screen.getByRole('button', { name: /story: space key story/i });

      // Test keyboard interaction
      fireEvent.keyDown(storyElement, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is focusable when interactive', () => {
      const handleClick = vi.fn();
      const story = createTestStory({ title: 'Focusable Story' });

      render(<StoryCard story={story} onClick={handleClick} />);

      const storyElement = screen.getByRole('button', { name: /story: focusable story/i });

      // Should be focusable
      expect(storyElement).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when not interactive and drag is disabled', () => {
      const story = createTestStory({ title: 'Non-interactive Story' });

      render(<StoryCard story={story} enableDrag={false} />);

      const storyArticle = screen.getByRole('article', { name: /story: non-interactive story/i });

      // Should not be focusable when no onClick handler and drag is disabled
      expect(storyArticle).not.toHaveAttribute('tabIndex');
    });
  });

  describe('styling and customization', () => {
    it('applies custom className while maintaining accessibility', () => {
      const story = createTestStory({ title: 'Custom Styled Story' });
      const customClass = 'custom-test-class';

      render(<StoryCard story={story} className={customClass} />);

      // Use accessible query and verify custom class is applied
      // When drag is enabled by default, the role becomes "button"
      const storyElement = screen.getByRole('button', { name: /story: custom styled story/i });
      expect(storyElement).toHaveClass(customClass);
    });

    it('applies anchor-specific styling for anchor stories', () => {
      const anchorStory = createTestStory({
        title: 'Anchor Story',
        isAnchor: true
      });

      render(<StoryCard story={anchorStory} />);

      const storyElement = screen.getByRole('button', { name: /anchor story \(anchor story\)/i });
      expect(storyElement).toHaveClass('border-primary');
      expect(storyElement).toHaveClass('bg-primary/5');
    });

    it('applies anchor-specific styling for anchor stories without drag', () => {
      const anchorStory = createTestStory({
        title: 'Anchor Story',
        isAnchor: true
      });

      render(<StoryCard story={anchorStory} enableDrag={false} />);

      const storyArticle = screen.getByRole('article', { name: /anchor story \(anchor story\)/i });
      expect(storyArticle).toHaveClass('border-primary');
      expect(storyArticle).toHaveClass('bg-primary/5');
    });

    it('applies regular styling for non-anchor stories', () => {
      const regularStory = createTestStory({
        title: 'Regular Story',
        isAnchor: false
      });

      render(<StoryCard story={regularStory} />);

      const storyElement = screen.getByRole('button', { name: /story: regular story$/i });
      expect(storyElement).toHaveClass('border-border');
      expect(storyElement).toHaveClass('bg-card');
    });

    it('applies regular styling for non-anchor stories without drag', () => {
      const regularStory = createTestStory({
        title: 'Regular Story',
        isAnchor: false
      });

      render(<StoryCard story={regularStory} enableDrag={false} />);

      const storyArticle = screen.getByRole('article', { name: /story: regular story$/i });
      expect(storyArticle).toHaveClass('border-border');
      expect(storyArticle).toHaveClass('bg-card');
    });
  });

  describe('position indicator styling', () => {
    it('shows green indicator for lower complexity (negative position)', () => {
      const story = createTestStory({
        position: -50,
        isAnchor: false
      });

      const { container } = render(<StoryCard story={story} />);
      const indicator = container.querySelector('.bg-green-400\\/60');

      expect(indicator).toBeInTheDocument();
    });

    it('shows orange indicator for higher complexity (positive position)', () => {
      const story = createTestStory({
        position: 50,
        isAnchor: false
      });

      const { container } = render(<StoryCard story={story} />);
      const indicator = container.querySelector('.bg-orange-400\\/60');

      expect(indicator).toBeInTheDocument();
    });

    it('shows blue indicator for same complexity as anchor (zero position)', () => {
      const story = createTestStory({
        position: 0,
        isAnchor: false
      });

      const { container } = render(<StoryCard story={story} />);
      const indicator = container.querySelector('.bg-blue-400\\/60');

      expect(indicator).toBeInTheDocument();
    });

    it('shows primary indicator for anchor stories', () => {
      const story = createTestStory({
        position: 0,
        isAnchor: true
      });

      const { container } = render(<StoryCard story={story} />);
      const indicator = container.querySelector('.bg-primary\\/30');

      expect(indicator).toBeInTheDocument();
    });
  });

  describe('accessibility and semantics', () => {
    it('provides proper ARIA labels for screen readers', () => {
      const story = createTestStory({
        title: 'Accessible Story',
        isAnchor: true
      });

      render(<StoryCard story={story} />);

      const storyElement = screen.getByRole('button', { 
        name: /story: accessible story \(anchor story\)/i 
      });

      expect(storyElement).toHaveAttribute('aria-label');
    });

    it('marks decorative elements as hidden from screen readers', () => {
      const story = createTestStory({
        title: 'Story with Decorations',
        isAnchor: true
      });

      const { container } = render(<StoryCard story={story} />);

      // Position indicator should be hidden from screen readers
      const positionIndicator = container.querySelector('[role="presentation"]');
      expect(positionIndicator).toBeInTheDocument();
      expect(positionIndicator).toHaveAttribute('aria-hidden', 'true');

      // Icon should be hidden from screen readers (text "Anchor" provides the meaning)
      const anchorIcon = container.querySelector('[aria-hidden="true"].lucide-anchor');
      expect(anchorIcon).toBeInTheDocument();
    });

    it('provides semantic structure with proper heading hierarchy', () => {
      const story = createTestStory({
        title: 'Semantic Story'
      });

      render(<StoryCard story={story} />);

      // Should use h3 for story titles (assuming h1 is page title, h2 is section)
      const heading = screen.getByRole('heading', { level: 3, name: /semantic story/i });
      expect(heading).toBeInTheDocument();
    });

    it('has proper focus management styles', () => {
      const handleClick = vi.fn();
      const story = createTestStory({ title: 'Focus Test Story' });

      const { container } = render(<StoryCard story={story} onClick={handleClick} />);
      const storyArticle = container.firstChild as HTMLElement;

      // Should have focus styles for keyboard navigation
      expect(storyArticle).toHaveClass('focus:outline-none');
      expect(storyArticle).toHaveClass('focus:ring-2');
      expect(storyArticle).toHaveClass('focus:ring-primary');
    });
  });

  describe('responsive design', () => {
    it('has appropriate width constraints', () => {
      const story = createTestStory();

      const { container } = render(<StoryCard story={story} />);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('min-w-[200px]');
      expect(card).toHaveClass('max-w-[280px]');
      expect(card).toHaveClass('w-full');
    });
  });

  describe('drag and drop functionality', () => {
    const renderWithDndContext = (component: React.ReactElement) => {
      return render(
        <DndContext onDragEnd={() => {}}>
          {component}
        </DndContext>
      );
    };

    it('renders drag handle when drag is enabled', () => {
      const story = createTestStory({ title: 'Draggable Story' });

      renderWithDndContext(<StoryCard story={story} enableDrag={true} />);

      const dragHandle = screen.getByRole('button', { name: /drag to reposition story/i });
      expect(dragHandle).toBeInTheDocument();
    });

    it('does not render drag handle when drag is disabled', () => {
      const story = createTestStory({ title: 'Non-draggable Story' });

      renderWithDndContext(<StoryCard story={story} enableDrag={false} />);

      const dragHandle = screen.queryByRole('button', { name: /drag to reposition story/i });
      expect(dragHandle).not.toBeInTheDocument();
    });

    it('applies dragging styles when isDragging is true', () => {
      const story = createTestStory({ title: 'Dragging Story' });

      const { container } = renderWithDndContext(
        <StoryCard story={story} isDragging={true} />
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('opacity-50');
      expect(card).toHaveClass('scale-105');
      expect(card).toHaveClass('shadow-2xl');
    });

    it('does not apply dragging styles when isDragging is false', () => {
      const story = createTestStory({ title: 'Not Dragging Story' });

      const { container } = renderWithDndContext(
        <StoryCard story={story} isDragging={false} />
      );
      const card = container.firstChild as HTMLElement;

      expect(card).not.toHaveClass('opacity-50');
      expect(card).not.toHaveClass('scale-105');
      expect(card).not.toHaveClass('shadow-2xl');
    });

    it('disables hover effects when dragging', () => {
      const story = createTestStory({ title: 'Dragging Story' });

      const { container } = renderWithDndContext(
        <StoryCard story={story} isDragging={true} />
      );
      const card = container.firstChild as HTMLElement;

      // Hover effects should be disabled when dragging
      expect(card).not.toHaveClass('hover:shadow-md');
      expect(card).not.toHaveClass('hover:scale-[1.02]');
    });

    it('maintains accessibility when drag is enabled', () => {
      const story = createTestStory({ title: 'Accessible Draggable Story' });

      renderWithDndContext(<StoryCard story={story} enableDrag={true} />);

      // Story should still be accessible (role changes to button when draggable)
      const storyElement = screen.getByRole('button', { name: /story: accessible draggable story/i });
      expect(storyElement).toBeInTheDocument();

      // Drag handle should be accessible as a button
      const dragHandle = screen.getByRole('button', { name: /drag to reposition story/i });
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveAttribute('type', 'button');
    });

    it('provides proper cursor styles for drag handle', () => {
      const story = createTestStory({ title: 'Cursor Test Story' });

      renderWithDndContext(<StoryCard story={story} enableDrag={true} />);

      const dragHandle = screen.getByRole('button', { name: /drag to reposition story/i });
      expect(dragHandle).toHaveClass('cursor-grab');
    });

    it('shows grabbing cursor when actively dragging', () => {
      const story = createTestStory({ title: 'Grabbing Cursor Story' });

      renderWithDndContext(<StoryCard story={story} enableDrag={true} isDragging={true} />);

      const dragHandle = screen.getByRole('button', { name: /drag to reposition story/i });
      expect(dragHandle).toHaveClass('cursor-grabbing');
    });

    it('maintains story content accessibility with drag handle', () => {
      const story = createTestStory({
        title: 'Story with Drag Handle',
        description: 'This story has a drag handle',
        isAnchor: true
      });

      renderWithDndContext(<StoryCard story={story} enableDrag={true} />);

      // All story content should still be accessible
      const storyElement = screen.getByRole('button', { name: /story: story with drag handle \(anchor story\)/i });
      const storyHeading = screen.getByRole('heading', { name: /story with drag handle/i });
      const storyDescription = screen.getByText(/this story has a drag handle/i);
      const anchorBadge = screen.getByText('Anchor');
      const dragHandle = screen.getByRole('button', { name: /drag to reposition story/i });

      expect(storyElement).toBeInTheDocument();
      expect(storyHeading).toBeInTheDocument();
      expect(storyDescription).toBeInTheDocument();
      expect(anchorBadge).toBeInTheDocument();
      expect(dragHandle).toBeInTheDocument();
    });
  });
});