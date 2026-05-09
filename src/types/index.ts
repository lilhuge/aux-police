export type QueueItemStatus = 'pending' | 'playing' | 'played' | 'skipped'
export type PlaybackMode = 'stop-on-empty' | 'loop'

export type QueueItem = {
	id: string
	sessionId: string
	position: number
	trackUri: string
	requestedByUserId: string
	requestedByUserName: string
	status: QueueItemStatus
	createdAt: string
}

export type Session = {
	id: string
	joinCode: string
	currentIndex: number | null
	playbackMode: PlaybackMode
	deviceId: string | null
	createdAt: string
}

export type SessionView = {
	session: Session
	nowPlaying: QueueItem | null
	upcoming: QueueItem[]
	history: QueueItem[]
}

export type CreateSessionBody = {
	playbackMode: PlaybackMode
}

export type JoinSessionBody = {
	joinCode: string
}

export type AddTrackBody = {
	trackUri: string
	requestedByUserId: string
	requestedByUserName: string
}

export type ReorderQueueBody = {
	orderedIds: string[]
}

export type RegisterDeviceBody = {
	deviceId: string
}
