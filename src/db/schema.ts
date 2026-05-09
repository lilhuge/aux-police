import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	spotifyUserId: text('spotify_user_id').unique().notNull(),
	displayName: text('display_name'),
	spotifyAccessToken: text('spotify_access_token'),
	spotifyRefreshToken: text('spotify_refresh_token'),
	spotifyTokenExpiresAt: timestamp('spotify_token_expires_at', {
		withTimezone: true,
	}),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	hostUserId: uuid('host_user_id')
		.references(() => users.id)
		.notNull(),
	joinCode: text('join_code').unique().notNull(),
	currentIndex: integer('current_index'),
	playbackMode: text('playback_mode').notNull().default('stop-on-empty'),
	deviceId: text('device_id'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const queueItems = pgTable('queue_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	sessionId: uuid('session_id')
		.references(() => sessions.id)
		.notNull(),
	position: integer('position').notNull(),
	trackUri: text('track_uri').notNull(),
	requestedByUserId: text('requested_by_user_id').notNull(),
	requestedByUserName: text('requested_by_user_name').notNull(),
	status: text('status').notNull().default('pending'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
	host: one(users, { fields: [sessions.hostUserId], references: [users.id] }),
	queueItems: many(queueItems),
}))

export const queueItemsRelations = relations(queueItems, ({ one }) => ({
	session: one(sessions, {
		fields: [queueItems.sessionId],
		references: [sessions.id],
	}),
}))
