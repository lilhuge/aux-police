// Custom Spotify OAuth login route.
//
// We can't use Auth.js's built-in Spotify provider because Auth.js v5 beta
// constructs the redirect_uri dynamically from the incoming request's Host
// header. Next.js dev server normalises the Host to "localhost" regardless of
// --hostname or AUTH_URL, so Auth.js always sends:
//   redirect_uri=http://localhost:3000/api/auth/callback/spotify
//
// Spotify banned localhost as a redirect URI in April 2025 (only 127.0.0.1
// is allowed for local development). No amount of trustHost, AUTH_URL, or
// x-forwarded-host overrides fixed it in this beta version.
//
// Solution: bypass Auth.js's Spotify provider entirely and implement the
// Authorization Code Flow ourselves, hardcoding 127.0.0.1 in the redirect URI.
// Auth.js is still used for session management (auth(), useSession()) — we
// just mint the JWE cookie ourselves in the callback route.

import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const SPOTIFY_SCOPES = [
	'streaming',
	'user-read-email',
	'user-read-private',
	'user-modify-playback-state',
	'user-read-playback-state',
].join(' ')

const REDIRECT_URI = 'http://127.0.0.1:3000/api/auth/spotify/callback'

export async function GET() {
	const state = randomBytes(16).toString('hex')

	const cookieStore = await cookies()
	cookieStore.set('spotify_oauth_state', state, {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 600,
		path: '/',
	})

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: process.env.AUTH_SPOTIFY_ID ?? '',
		scope: SPOTIFY_SCOPES,
		redirect_uri: REDIRECT_URI,
		state,
	})

	return NextResponse.redirect(
		`https://accounts.spotify.com/authorize?${params.toString()}`,
	)
}
