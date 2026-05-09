import type {
	PlaybackMode,
	QueueItem,
	QueueItemStatus,
	Session,
	SessionView,
} from '@/types'

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

function toQueueItem(row: DbQueueItem): QueueItem {
	return {
		id: row.id,
		sessionId: row.sessionId,
		position: row.position,
		trackUri: row.trackUri,
		requestedByUserId: row.requestedByUserId,
		requestedByUserName: row.requestedByUserName,
		status: row.status as QueueItemStatus,
		createdAt: row.createdAt.toISOString(),
	}
}

function toSession(row: DbSession): Session {
	return {
		id: row.id,
		joinCode: row.joinCode,
		currentIndex: row.currentIndex,
		playbackMode: row.playbackMode as PlaybackMode,
		deviceId: row.deviceId,
		createdAt: row.createdAt.toISOString(),
	}
}

export function buildSessionView(
	sessionRow: DbSession,
	itemRows: DbQueueItem[],
): SessionView {
	const session = toSession(sessionRow)

	const nowPlayingRow = itemRows.find(i => i.status === 'playing') ?? null
	const nowPlaying = nowPlayingRow ? toQueueItem(nowPlayingRow) : null

	const upcoming = itemRows
		.filter(i => i.status === 'pending')
		.sort((a, b) => a.position - b.position)
		.map(toQueueItem)

	const history = itemRows
		.filter(i => i.status === 'played' || i.status === 'skipped')
		.sort((a, b) => a.position - b.position)
		.map(toQueueItem)

	return { session, nowPlaying, upcoming, history }
}
