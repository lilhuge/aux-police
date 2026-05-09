export function parseTrackUri(input: string): string {
	if (!input) throw new Error('Empty input')

	if (input.startsWith('spotify:track:')) {
		const trackId = input.split(':')[2]
		if (!trackId || trackId.length < 10) throw new Error('Invalid Spotify URI')
		return input
	}

	try {
		const url = new URL(input)
		if (url.hostname !== 'open.spotify.com') throw new Error('Not a Spotify URL')
		const parts = url.pathname.split('/')
		const trackIndex = parts.indexOf('track')
		if (trackIndex === -1 || !parts[trackIndex + 1])
			throw new Error('Not a track URL')
		return `spotify:track:${parts[trackIndex + 1]}`
	} catch (e) {
		if (e instanceof Error && e.message.startsWith('Not a')) throw e
		throw new Error(`Invalid Spotify URL or URI: ${input}`)
	}
}

export async function getValidAccessToken(
	userId: string,
): Promise<{ accessToken: string }> {
	const { db } = await import('@/db')
	const { users } = await import('@/db/schema')
	const { eq } = await import('drizzle-orm')

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	})

	if (!user?.spotifyAccessToken) {
		throw new Error('No Spotify access token for user')
	}

	const now = new Date()
	const expiresAt = user.spotifyTokenExpiresAt
	const needsRefresh =
		!expiresAt || expiresAt.getTime() - now.getTime() < 60_000

	if (!needsRefresh) {
		return { accessToken: user.spotifyAccessToken }
	}

	if (!user.spotifyRefreshToken) {
		throw new Error('No refresh token available')
	}

	const params = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: user.spotifyRefreshToken,
	})

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${Buffer.from(
				`${process.env.AUTH_SPOTIFY_ID}:${process.env.AUTH_SPOTIFY_SECRET}`,
			).toString('base64')}`,
		},
		body: params,
	})

	if (!response.ok) {
		throw new Error(`Spotify token refresh failed: ${response.status}`)
	}

	const data = (await response.json()) as {
		access_token: string
		expires_in: number
		refresh_token?: string
	}

	const newExpiresAt = new Date(Date.now() + data.expires_in * 1000)

	await db
		.update(users)
		.set({
			spotifyAccessToken: data.access_token,
			spotifyRefreshToken: data.refresh_token ?? user.spotifyRefreshToken,
			spotifyTokenExpiresAt: newExpiresAt,
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))

	return { accessToken: data.access_token }
}

export async function spotifyPlay(
	accessToken: string,
	deviceId: string,
	trackUri: string,
): Promise<void> {
	const response = await fetch(
		`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
		{
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ uris: [trackUri] }),
		},
	)

	if (!response.ok && response.status !== 204) {
		throw new Error(`Spotify play failed: ${response.status}`)
	}
}

export async function spotifyPause(
	accessToken: string,
	deviceId: string,
): Promise<void> {
	await fetch(
		`https://api.spotify.com/v1/me/player/pause?device_id=${encodeURIComponent(deviceId)}`,
		{
			method: 'PUT',
			headers: { Authorization: `Bearer ${accessToken}` },
		},
	)
}
