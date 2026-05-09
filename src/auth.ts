// Auth.js is kept for session management only (auth(), useSession(), JWT decoding).
//
// We cannot use Auth.js's Spotify provider because in v5 beta it constructs the
// redirect_uri from the request Host header, which Next.js always normalises to
// "localhost". Spotify banned localhost as a redirect URI in April 2025.
// All workarounds (AUTH_URL, trustHost, x-forwarded-host, Next.js proxy) failed
// to override this behaviour in the beta runtime.
//
// Instead, the full OAuth dance lives in /api/auth/spotify/ (login + callback),
// which hardcodes 127.0.0.1. On successful auth the callback mints an Auth.js-
// compatible JWE cookie so the rest of the app works unchanged.

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		// Credentials provider exists only so Auth.js initialises without a real provider.
		// It is never called — sessions are created by minting JWE cookies directly.
		Credentials({
			credentials: {},
			authorize: () => null,
		}),
	],
	callbacks: {
		async jwt({ token }) {
			// userId is embedded in the JWE we mint in the callback route
			return token
		},
		async session({ session, token }) {
			if (token.userId) session.user.id = token.userId as string
			return session
		},
	},
	session: { strategy: 'jwt' },
	trustHost: true,
})
