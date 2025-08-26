/**
 * Tests for StoryCard component
 * Following accessibility-first testing principles
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
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

      // Use semantic queries - article role and heading
      const storyArticle = screen.getByRole('article', { name: /story: user authentication/i });
      const storyHeading = screen.getByRole('heading', { name: /user authentication/i });
      const storyDescription = screen.getByText(/implement login and registration functionality/i);

      expect(storyArticle).toBeInTheDocument();
      expect(storyHeading).toBeInTheDocument();
      expect(storyDescription).toBeInTheDocument();
    });

    it('renders story without description when description is empty', () => {
      const story = createTestStory({
        title: 'Simple Story',
        description: ''
      });

      render(<StoryCard story={story} />);

      // Use semantic queries
      const storyArticle = screen.getByRole('article', { name: /story: simple story/i });
      const storyHeading = screen.getByRole('heading', { name: /simple story/i });

      expect(storyArticle).toBeInTheDocument();
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

      // Use accessible queries
      const storyArticle = screen.getByRole('article', { name: /story: anchor story \(anchor story\)/i });
      const anchorBadge = screen.getByText('Anchor');
      const storyHeading = screen.getByRole('heading', { name: /anchor story/i });

      expect(storyArticle).toBeInTheDocument();
      expect(anchorBadge).toBeInTheDocument();
      expect(storyHeading).toBeInTheDocument();
    });

    it('does not show anchor indicators for regular stories', () => {
      const regularStory = createTestStory({
        title: 'Regular Story',
        isAnchor: false
      });

      render(<StoryCard story={regularStory} />);

      // Use accessible queries
      const storyArticle = screen.getByRole('article', { name: /story: regular story$/i });
      const storyHeading = screen.getByRole('heading', { name: /regular story/i });

      expect(storyArticle).toBeInTheDocument();
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

      // Use accessible query - the article should be clickable
      const storyArticle = screen.getByRole('article', { name: /story: clickable story/i });

      fireEvent.click(storyArticle);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('allows users to double-click on story cards', () => {
      const handleDoubleClick = vi.fn();
      const story = createTestStory({ title: 'Double-clickable Story' });

      render(<StoryCard story={story} onDoubleClick={handleDoubleClick} />);

      // Use accessible query
      const storyArticle = screen.getByRole('article', { name: /story: double-clickable story/i });

      fireEvent.doubleClick(storyArticle);
      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation with Enter key', () => {
      const handleClick = vi.fn();
      const story = createTestStory({ title: 'Keyboard Accessible Story' });

      render(<StoryCard story={story} onClick={handleClick} />);

      const storyArticle = screen.getByRole('article', { name: /story: keyboard accessible story/i });

      // Test keyboard interaction
      fireEvent.keyDown(storyArticle, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation with Space key', () => {
      const handleClick = vi.fn();
      const story = createTestStory({ title: 'Space Key Story' });

      render(<StoryCard story={story} onClick={handleClick} />);

      const storyArticle = screen.getByRole('article', { name: /story: space key story/i });

      // Test keyboard interaction
      fireEvent.keyDown(storyArticle, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is focusable when interactive', () => {
      const handleClick = vi.fn();
      const story = createTestStory({ title: 'Focusable Story' });

      render(<StoryCard story={story} onClick={handleClick} />);

      const storyArticle = screen.getByRole('article', { name: /story: focusable story/i });

      // Should be focusable
      expect(storyArticle).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when not interactive', () => {
      const story = createTestStory({ title: 'Non-interactive Story' });

      render(<StoryCard story={story} />);

      const storyArticle = screen.getByRole('article', { name: /story: non-interactive story/i });

      // Should not be focusable
      expect(storyArticle).not.toHaveAttribute('tabIndex');
    });
  });

  describe('styling and customization', () => {
    it('applies custom className while maintaining accessibility', () => {
      const story = createTestStory({ title: 'Custom Styled Story' });
      const customClass = 'custom-test-class';

      render(<StoryCard story={story} className={customClass} />);

      // Use accessible query and verify custom class is applied
      const storyArticle = screen.getByRole('article', { name: /story: custom styled story/i });
      expect(storyArticle).toHaveClass(customClass);
    });

    it('applies anchor-specific styling for anchor stories', () => {
      const anchorStory = createTestStory({
        title: 'Anchor Story',
        isAnchor: true
      });

      render(<StoryCard story={anchorStory} />);

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

      const storyArticle = screen.getByRole('article', { 
        name: /story: accessible story \(anchor story\)/i 
      });

      expect(storyArticle).toHaveAttribute('aria-label');
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
});