import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import NextAuth from 'next-auth'
import Spotify from 'next-auth/providers/spotify'

const SPOTIFY_SCOPES = [
	'streaming',
	'user-read-email',
	'user-read-private',
	'user-modify-playback-state',
	'user-read-playback-state',
].join(' ')

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		Spotify({
			clientId: process.env.AUTH_SPOTIFY_ID!,
			clientSecret: process.env.AUTH_SPOTIFY_SECRET!,
			authorization: {
				params: { scope: SPOTIFY_SCOPES },
			},
		}),
	],
	callbacks: {
		async signIn({ account, profile }) {
			if (account?.provider !== 'spotify' || !account.access_token) return false

			const spotifyUserId = profile?.id as string
			const displayName = (profile?.display_name as string) ?? null
			const expiresAt = account.expires_at
				? new Date(account.expires_at * 1000)
				: null

			const existing = await db.query.users.findFirst({
				where: eq(users.spotifyUserId, spotifyUserId),
			})

			if (existing) {
				await db
					.update(users)
					.set({
						spotifyAccessToken: account.access_token,
						spotifyRefreshToken: account.refresh_token ?? existing.spotifyRefreshToken,
						spotifyTokenExpiresAt: expiresAt,
						displayName,
						updatedAt: new Date(),
					})
					.where(eq(users.id, existing.id))
			} else {
				await db.insert(users).values({
					spotifyUserId,
					displayName,
					spotifyAccessToken: account.access_token,
					spotifyRefreshToken: account.refresh_token ?? null,
					spotifyTokenExpiresAt: expiresAt,
				})
			}

			return true
		},

		async jwt({ token, account, profile }) {
			if (account?.provider === 'spotify' && profile?.id) {
				const user = await db.query.users.findFirst({
					where: eq(users.spotifyUserId, profile.id as string),
				})
				if (user) token.userId = user.id
			}
			return token
		},

		async session({ session, token }) {
			if (token.userId) {
				session.user.id = token.userId as string
			}
			return session
		},
	},
	session: { strategy: 'jwt' },
})
