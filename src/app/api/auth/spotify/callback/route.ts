import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { encode } from '@auth/core/jwt'
import { db } from '@/db'
import { users } from '@/db/schema'

const BASE_URL = process.env.AUTH_URL ?? 'http://127.0.0.1:3000'
const REDIRECT_URI = `${BASE_URL}/api/auth/spotify/callback`
const isSecure = BASE_URL.startsWith('https')
const COOKIE_NAME = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function GET(req: Request) {
	const url = new URL(req.url)
	const code = url.searchParams.get('code')
	const state = url.searchParams.get('state')
	const error = url.searchParams.get('error')

	const cookieStore = await cookies()
	const savedState = cookieStore.get('spotify_oauth_state')?.value
	cookieStore.delete('spotify_oauth_state')

	if (error || !code || !state || state !== savedState) {
		return NextResponse.redirect(`${BASE_URL}/?error=oauth`)
	}

	// Exchange code for tokens
	const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${Buffer.from(
				`${process.env.AUTH_SPOTIFY_ID}:${process.env.AUTH_SPOTIFY_SECRET}`,
			).toString('base64')}`,
		},
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: REDIRECT_URI,
		}).toString(),
	})

	if (!tokenRes.ok) {
		return NextResponse.redirect(`${BASE_URL}/?error=token`)
	}

	const tokenData = (await tokenRes.json()) as {
		access_token: string
		refresh_token?: string
		expires_in: number
	}

	// Fetch Spotify profile
	const profileRes = await fetch('https://api.spotify.com/v1/me', {
		headers: { Authorization: `Bearer ${tokenData.access_token}` },
	})

	if (!profileRes.ok) {
		return NextResponse.redirect(`${BASE_URL}/?error=profile`)
	}

	const profile = (await profileRes.json()) as {
		id: string
		display_name?: string
	}

	const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

	// Upsert user
	const existing = await db.query.users.findFirst({
		where: eq(users.spotifyUserId, profile.id),
	})

	let userId: string

	if (existing) {
		await db
			.update(users)
			.set({
				spotifyAccessToken: tokenData.access_token,
				spotifyRefreshToken:
					tokenData.refresh_token ?? existing.spotifyRefreshToken,
				spotifyTokenExpiresAt: expiresAt,
				displayName: profile.display_name ?? null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, existing.id))
		userId = existing.id
	} else {
		const [newUser] = await db
			.insert(users)
			.values({
				spotifyUserId: profile.id,
				displayName: profile.display_name ?? null,
				spotifyAccessToken: tokenData.access_token,
				spotifyRefreshToken: tokenData.refresh_token ?? null,
				spotifyTokenExpiresAt: expiresAt,
			})
			.returning({ id: users.id })
		userId = newUser.id
	}

	// Mint an Auth.js-compatible JWE so auth() and useSession() work normally
	const jwe = await encode({
		token: { userId, sub: userId },
		secret: process.env.AUTH_SECRET ?? '',
		maxAge: THIRTY_DAYS,
		salt: COOKIE_NAME,
	})

	const response = NextResponse.redirect(`${BASE_URL}/`)
	response.cookies.set(COOKIE_NAME, jwe, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: THIRTY_DAYS,
		secure: isSecure,
	})

	return response
}
