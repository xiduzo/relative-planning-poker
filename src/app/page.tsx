'use client';

import React from 'react';
import { StoryCard } from '@/components/StoryCard';
import { Button } from '@/components/ui/button';
import { usePlanningStore } from '@/stores/planning-store';
import { Plus } from 'lucide-react';

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

        {currentSession.stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No stories yet</p>
            <Button onClick={handleAddStory} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Story
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal axis visualization */}
            <div className="mb-8 relative">
              <div className="h-px bg-border w-full relative">
                <div className="absolute left-0 top-0 h-2 w-px bg-green-500 -translate-y-1/2" />
                <div className="absolute left-1/2 top-0 h-4 w-px bg-primary -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute right-0 top-0 h-2 w-px bg-orange-500 -translate-y-1/2" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Lower Complexity</span>
                <span>Anchor</span>
                <span>Higher Complexity</span>
              </div>
            </div>

            {/* Stories positioned along the axis */}
            <div className="relative min-h-[200px] w-full">
              {currentSession.stories.map((story) => {
                // Convert position (-100 to 100) to percentage (0% to 100%)
                const leftPercentage = ((story.position + 100) / 200) * 100;
                
                return (
                  <div
                    key={story.id}
                    className="absolute top-0"
                    style={{
                      left: `${Math.max(0, Math.min(100, leftPercentage))}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <StoryCard story={story} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Debug information */}
        {currentSession.stories.length > 0 && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Debug Information</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              {currentSession.stories.map((story) => (
                <div key={story.id} className="flex justify-between">
                  <span>{story.title}</span>
                  <span>Position: {story.position}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
