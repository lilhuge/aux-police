import type {
	AddTrackBody,
	CreateSessionBody,
	JoinSessionBody,
	RegisterDeviceBody,
	SessionView,
} from '@/types'

const BASE = '/api'

export async function createSession(
	body: CreateSessionBody,
): Promise<{ session: { id: string; joinCode: string } }> {
	const res = await fetch(`${BASE}/sessions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) throw new Error('Failed to create session')
	return res.json()
}

export async function joinSession(
	body: JoinSessionBody,
): Promise<{ sessionId: string }> {
	const res = await fetch(`${BASE}/sessions/join`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) throw new Error('Session not found')
	return res.json()
}

export async function getSessionView(sessionId: string): Promise<SessionView> {
	const res = await fetch(`${BASE}/sessions/${sessionId}`)
	if (!res.ok) throw new Error('Failed to fetch session')
	return res.json()
}

export async function addTrack(
	sessionId: string,
	body: AddTrackBody,
): Promise<void> {
	const res = await fetch(`${BASE}/sessions/${sessionId}/queue`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) throw new Error('Failed to add track')
}

export async function registerDevice(
	sessionId: string,
	body: RegisterDeviceBody,
): Promise<void> {
	const res = await fetch(`${BASE}/sessions/${sessionId}/device`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) throw new Error('Failed to register device')
}

export async function notifyTrackFinished(sessionId: string): Promise<void> {
	const res = await fetch(`${BASE}/sessions/${sessionId}/track-finished`, {
		method: 'POST',
	})
	if (!res.ok) throw new Error('Failed to notify track finished')
}

export async function skipTrack(sessionId: string): Promise<void> {
	const res = await fetch(`${BASE}/sessions/${sessionId}/skip`, {
		method: 'POST',
	})
	if (!res.ok) throw new Error('Failed to skip track')
}

export async function getSpotifyAccessToken(): Promise<string> {
	const res = await fetch(`${BASE}/spotify/access-token`)
	if (!res.ok) throw new Error('Failed to get Spotify token')
	const data = (await res.json()) as { accessToken: string }
	return data.accessToken
}
