import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  anchorStoryId: text('anchor_story_id'),
  anchorStoryPoints: integer('anchor_story_points'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastModified: timestamp('last_modified').notNull().defaultNow(),
})

export const stories = pgTable('stories', {
  id: text('id').primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  positionX: integer('position_x').notNull().default(0),
  positionY: integer('position_y').notNull().default(0),
  isAnchor: boolean('is_anchor').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Relations
export const sessionsRelations = relations(sessions, ({ many }) => ({
  stories: many(stories),
}))

export const storiesRelations = relations(stories, ({ one }) => ({
  session: one(sessions, {
    fields: [stories.sessionId],
    references: [sessions.id],
  }),
}))

// Type exports
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Story = typeof stories.$inferSelect
export type NewStory = typeof stories.$inferInsert
