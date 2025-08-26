'use client';

import React from 'react';
import { PlanningCanvas } from '@/components/PlanningCanvas';
import { Button } from '@/components/ui/button';
import { usePlanningStore } from '@/stores/planning-store';
import { Plus } from 'lucide-react';
import type { Story } from '@/types';

export default function Home() {
  const { currentSession, createSession, addStory } = usePlanningStore();

  React.useEffect(() => {
    // Create a demo session if none exists
    if (!currentSession) {
      createSession('Demo Planning Session');
    }
  }, [currentSession, createSession]);

  const handleAddStory = () => {
    const storyCount = currentSession?.stories.length || 0;
    addStory({
      title: `Story ${storyCount + 1}`,
      description: `This is a sample story for testing drag and drop functionality. Story number ${storyCount + 1}.`,
    });
  };

  const handleStoryClick = (story: Story) => {
    console.log('Story clicked:', story.title);
    // TODO: Implement story editing functionality
  };

  const handleStoryDoubleClick = (story: Story) => {
    console.log('Story double-clicked:', story.title);
    // TODO: Implement quick edit functionality
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Setting up your planning session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Relative Planning Poker</h1>
              <p className="text-sm text-muted-foreground">
                Session: {currentSession.name}
              </p>
            </div>
            <Button onClick={handleAddStory} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Story
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Stories</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Drag stories left or right to indicate relative complexity. 
            Left = Lower complexity, Right = Higher complexity.
          </p>
        </div>

        <PlanningCanvas
          onStoryClick={handleStoryClick}
          onStoryDoubleClick={handleStoryDoubleClick}
        />

        {currentSession.stories.length === 0 && (
          <div className="text-center py-12">
            <Button onClick={handleAddStory} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Story
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
