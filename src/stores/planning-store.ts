/**
 * Zustand store for managing planning session state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    PlanningSession,
    Story,
    PointCutoff,
    CreateStoryInput,
    ExportData,
    StorySchema,
    CreateStoryInputSchema,
    PlanningSessionSchema
} from '@/types';
import { generateId } from '@/utils';
import { normalizePosition } from '@/utils/position';

export interface PlanningStore {
    // State
    currentSession: PlanningSession | null;

    // Session actions
    createSession: (name: string) => void;
    loadSession: (sessionId: string) => boolean;
    clearSession: () => void;

    // Story management actions
    addStory: (input: CreateStoryInput) => void;
    updateStory: (storyId: string, updates: Partial<Pick<Story, 'title' | 'description'>>) => void;
    updateStoryPosition: (storyId: string, position: number) => void;
    deleteStory: (storyId: string) => void;

    // Anchor story management
    setAnchorStory: (storyId: string) => void;

    // Point assignment mode
    togglePointAssignmentMode: () => void;
    updatePointCutoffs: (cutoffs: PointCutoff[]) => void;

    // Export functionality
    exportResults: () => ExportData;
}

const STORAGE_KEY = 'relative-planning-poker-sessions';

// Helper function to get all sessions from localStorage
const getAllSessions = (): Record<string, PlanningSession> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Failed to load sessions from localStorage:', error);
        return {};
    }
};

// Helper function to save session to localStorage
const saveSession = (session: PlanningSession): void => {
    try {
        const sessions = getAllSessions();
        sessions[session.id] = session;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
        console.error('Failed to save session to localStorage:', error);
    }
};

// Helper function to delete session from localStorage
const deleteSessionFromStorage = (sessionId: string): void => {
    try {
        const sessions = getAllSessions();
        delete sessions[sessionId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
        console.error('Failed to delete session from localStorage:', error);
    }
};

export const usePlanningStore = create<PlanningStore>()(
    persist(
        (set, get) => ({
            currentSession: null,

            createSession: (name: string) => {
                const now = new Date();
                const session: PlanningSession = {
                    id: generateId(),
                    name: name.trim(),
                    stories: [],
                    anchorStoryId: null,
                    pointCutoffs: [],
                    isPointAssignmentMode: false,
                    createdAt: now,
                    lastModified: now
                };

                // Validate the session
                const validationResult = PlanningSessionSchema.safeParse(session);
                if (!validationResult.success) {
                    console.error('Invalid session data:', validationResult.error);
                    throw new Error('Failed to create session: Invalid data');
                }

                set({ currentSession: session });
                saveSession(session);
            },

            loadSession: (sessionId: string) => {
                try {
                    const sessions = getAllSessions();
                    const session = sessions[sessionId];

                    if (!session) {
                        return false;
                    }

                    // Parse dates from stored JSON
                    const parsedSession: PlanningSession = {
                        ...session,
                        createdAt: new Date(session.createdAt),
                        lastModified: new Date(session.lastModified),
                        stories: session.stories.map(story => ({
                            ...story,
                            createdAt: new Date(story.createdAt),
                            updatedAt: new Date(story.updatedAt)
                        }))
                    };

                    // Validate the loaded session
                    const validationResult = PlanningSessionSchema.safeParse(parsedSession);
                    if (!validationResult.success) {
                        console.error('Invalid session data loaded:', validationResult.error);
                        return false;
                    }

                    set({ currentSession: parsedSession });
                    return true;
                } catch (error) {
                    console.error('Failed to load session:', error);
                    return false;
                }
            },

            clearSession: () => {
                const { currentSession } = get();
                if (currentSession) {
                    deleteSessionFromStorage(currentSession.id);
                }
                set({ currentSession: null });
            },

            addStory: (input: CreateStoryInput) => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session');
                }

                // Validate input
                const validationResult = CreateStoryInputSchema.safeParse(input);
                if (!validationResult.success) {
                    throw new Error(`Invalid story data: ${validationResult.error.message}`);
                }

                const now = new Date();
                const isFirstStory = currentSession.stories.length === 0;

                const newStory: Story = {
                    id: generateId(),
                    title: input.title.trim(),
                    description: input.description.trim(),
                    position: 0, // Start at center (anchor position)
                    isAnchor: isFirstStory,
                    createdAt: now,
                    updatedAt: now
                };

                // Validate the new story
                const storyValidation = StorySchema.safeParse(newStory);
                if (!storyValidation.success) {
                    throw new Error(`Invalid story: ${storyValidation.error.message}`);
                }

                const updatedSession: PlanningSession = {
                    ...currentSession,
                    stories: [...currentSession.stories, newStory],
                    anchorStoryId: isFirstStory ? newStory.id : currentSession.anchorStoryId,
                    lastModified: now
                };

                set({ currentSession: updatedSession });
                saveSession(updatedSession);
            },

            updateStory: (storyId: string, updates: Partial<Pick<Story, 'title' | 'description'>>) => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session');
                }

                const storyIndex = currentSession.stories.findIndex(s => s.id === storyId);
                if (storyIndex === -1) {
                    throw new Error('Story not found');
                }

                const now = new Date();
                const updatedStories = [...currentSession.stories];
                updatedStories[storyIndex] = {
                    ...updatedStories[storyIndex],
                    ...updates,
                    title: updates.title?.trim() || updatedStories[storyIndex].title,
                    description: updates.description?.trim() || updatedStories[storyIndex].description,
                    updatedAt: now
                };

                // Validate the updated story
                const storyValidation = StorySchema.safeParse(updatedStories[storyIndex]);
                if (!storyValidation.success) {
                    throw new Error(`Invalid story update: ${storyValidation.error.message}`);
                }

                const updatedSession: PlanningSession = {
                    ...currentSession,
                    stories: updatedStories,
                    lastModified: now
                };

                set({ currentSession: updatedSession });
                saveSession(updatedSession);
            },

            updateStoryPosition: (storyId: string, position: number) => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session');
                }

                const storyIndex = currentSession.stories.findIndex(s => s.id === storyId);
                if (storyIndex === -1) {
                    throw new Error('Story not found');
                }

                // Normalize position to valid range
                const normalizedPosition = normalizePosition(position);
                const now = new Date();

                const updatedStories = [...currentSession.stories];
                updatedStories[storyIndex] = {
                    ...updatedStories[storyIndex],
                    position: normalizedPosition,
                    updatedAt: now
                };

                const updatedSession: PlanningSession = {
                    ...currentSession,
                    stories: updatedStories,
                    lastModified: now
                };

                set({ currentSession: updatedSession });
                saveSession(updatedSession);
            },

            deleteStory: (storyId: string) => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session');
                }

                const storyToDelete = currentSession.stories.find(s => s.id === storyId);
                if (!storyToDelete) {
                    throw new Error('Story not found');
                }

                const remainingStories = currentSession.stories.filter(s => s.id !== storyId);
                const now = new Date();

                let newAnchorStoryId = currentSession.anchorStoryId;

                // If we're deleting the anchor story, promote another story to anchor
                if (storyToDelete.isAnchor && remainingStories.length > 0) {
                    // Find the story closest to position 0 to be the new anchor
                    const newAnchor = remainingStories.reduce((closest, story) =>
                        Math.abs(story.position) < Math.abs(closest.position) ? story : closest
                    );

                    newAnchor.isAnchor = true;
                    newAnchorStoryId = newAnchor.id;
                } else if (remainingStories.length === 0) {
                    newAnchorStoryId = null;
                }

                const updatedSession: PlanningSession = {
                    ...currentSession,
                    stories: remainingStories,
                    anchorStoryId: newAnchorStoryId,
                    lastModified: now
                };

                set({ currentSession: updatedSession });
                saveSession(updatedSession);
            },

            setAnchorStory: (storyId: string) => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session');
                }

                const targetStory = currentSession.stories.find(s => s.id === storyId);
                if (!targetStory) {
                    throw new Error('Story not found');
                }

                const now = new Date();
                const updatedStories = currentSession.stories.map(story => ({
                    ...story,
                    isAnchor: story.id === storyId,
                    updatedAt: story.id === storyId || story.isAnchor ? now : story.updatedAt
                }));

                const updatedSession: PlanningSession = {
                    ...currentSession,
                    stories: updatedStories,
                    anchorStoryId: storyId,
                    lastModified: now
                };

                set({ currentSession: updatedSession });
                saveSession(updatedSession);
            },

            togglePointAssignmentMode: () => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session');
                }

                const updatedSession: PlanningSession = {
                    ...currentSession,
                    isPointAssignmentMode: !currentSession.isPointAssignmentMode,
                    lastModified: new Date()
                };

                set({ currentSession: updatedSession });
                saveSession(updatedSession);
            },

            updatePointCutoffs: (cutoffs: PointCutoff[]) => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session');
                }

                const updatedSession: PlanningSession = {
                    ...currentSession,
                    pointCutoffs: [...cutoffs],
                    lastModified: new Date()
                };

                set({ currentSession: updatedSession });
                saveSession(updatedSession);
            },

            exportResults: (): ExportData => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session to export');
                }

                // Calculate story points based on cutoffs
                const storiesWithPoints = currentSession.stories.map(story => {
                    let storyPoints: number | null = null;

                    // Find the appropriate point value based on cutoffs
                    const sortedCutoffs = [...currentSession.pointCutoffs].sort((a, b) => a.position - b.position);

                    for (let i = 0; i < sortedCutoffs.length; i++) {
                        const cutoff = sortedCutoffs[i];
                        const nextCutoff = sortedCutoffs[i + 1];

                        if (nextCutoff) {
                            // Story is between this cutoff and the next
                            if (story.position >= cutoff.position && story.position < nextCutoff.position) {
                                storyPoints = cutoff.pointValue;
                                break;
                            }
                        } else {
                            // This is the last cutoff, story is beyond it
                            if (story.position >= cutoff.position) {
                                storyPoints = cutoff.pointValue;
                                break;
                            }
                        }
                    }

                    return {
                        title: story.title,
                        description: story.description,
                        storyPoints,
                        relativePosition: story.position
                    };
                });

                return {
                    sessionName: currentSession.name,
                    exportedAt: new Date(),
                    stories: storiesWithPoints,
                    totalStories: currentSession.stories.length
                };
            }
        }),
        {
            name: 'planning-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ currentSession: state.currentSession }),
        }
    )
);