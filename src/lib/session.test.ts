import { describe, expect, it } from 'vitest'
import { buildSessionView } from './session'

type DbSession = {
	id: string
	joinCode: string
	hostUserId: string
	currentIndex: number | null
	playbackMode: string
	deviceId: string | null
	createdAt: Date
}

type DbQueueItem = {
	id: string
	sessionId: string
	position: number
	trackUri: string
	requestedByUserId: string
	requestedByUserName: string
	status: string
	createdAt: Date
}

function makeSession(overrides: Partial<DbSession> = {}): DbSession {
	return {
		id: 'sess1',
		joinCode: 'ABCD',
		hostUserId: 'user1',
		currentIndex: null,
		playbackMode: 'stop-on-empty',
		deviceId: null,
		createdAt: new Date('2024-01-01'),
		...overrides,
	}
}

function makeItem(overrides: Partial<DbQueueItem> = {}): DbQueueItem {
	return {
		id: 'item1',
		sessionId: 'sess1',
		position: 10,
		trackUri: 'spotify:track:abc',
		requestedByUserId: 'guest1',
		requestedByUserName: 'Alice',
		status: 'pending',
		createdAt: new Date('2024-01-01'),
		...overrides,
	}
}

describe('buildSessionView', () => {
	it('returns empty now playing and lists when queue is empty', () => {
		const view = buildSessionView(makeSession(), [])
		expect(view.nowPlaying).toBeNull()
		expect(view.upcoming).toHaveLength(0)
		expect(view.history).toHaveLength(0)
	})

	it('identifies now playing item by playing status', () => {
		const items = [
			makeItem({ id: 'a', position: 10, status: 'playing' }),
			makeItem({ id: 'b', position: 20, status: 'pending' }),
		]
		const view = buildSessionView(makeSession(), items)
		expect(view.nowPlaying?.id).toBe('a')
		expect(view.upcoming).toHaveLength(1)
		expect(view.upcoming[0].id).toBe('b')
	})

	it('puts played and skipped items in history, ordered by position', () => {
		const items = [
			makeItem({ id: 'a', position: 10, status: 'played' }),
			makeItem({ id: 'b', position: 20, status: 'skipped' }),
			makeItem({ id: 'c', position: 30, status: 'playing' }),
		]
		const view = buildSessionView(makeSession(), items)
		expect(view.history.map(i => i.id)).toEqual(['a', 'b'])
	})

	it('sorts upcoming by position ascending', () => {
		const items = [
			makeItem({ id: 'c', position: 30, status: 'pending' }),
			makeItem({ id: 'a', position: 10, status: 'playing' }),
			makeItem({ id: 'b', position: 20, status: 'pending' }),
		]
		const view = buildSessionView(makeSession(), items)
		expect(view.upcoming.map(i => i.id)).toEqual(['b', 'c'])
	})
})
