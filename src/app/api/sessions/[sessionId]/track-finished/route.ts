import { auth } from '@/auth'
import { db } from '@/db'
import { queueItems, sessions } from '@/db/schema'
import { getValidAccessToken, spotifyPlay } from '@/lib/spotify'
import { and, asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params
	const authSession = await auth()
	if (!authSession?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) })
	if (!session || session.hostUserId !== authSession.user.id) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	await db
		.update(queueItems)
		.set({ status: 'played' })
		.where(and(eq(queueItems.sessionId, sessionId), eq(queueItems.status, 'playing')))

	const nextItem = await db.query.queueItems.findFirst({
		where: and(eq(queueItems.sessionId, sessionId), eq(queueItems.status, 'pending')),
		orderBy: asc(queueItems.position),
	})

	if (nextItem) {
		await db.update(queueItems).set({ status: 'playing' }).where(eq(queueItems.id, nextItem.id))
		if (session.deviceId) {
			try {
				const { accessToken } = await getValidAccessToken(authSession.user.id)
				await spotifyPlay(accessToken, session.deviceId, nextItem.trackUri)
			} catch (err) {
				console.error('Spotify play error:', err)
			}
		}
		return NextResponse.json({ playing: nextItem.id })
	}

	if (session.playbackMode === 'loop') {
		await db
			.update(queueItems)
			.set({ status: 'pending' })
			.where(and(eq(queueItems.sessionId, sessionId), eq(queueItems.status, 'played')))

		const loopFirst = await db.query.queueItems.findFirst({
			where: and(eq(queueItems.sessionId, sessionId), eq(queueItems.status, 'pending')),
			orderBy: asc(queueItems.position),
		})

		if (loopFirst) {
			await db.update(queueItems).set({ status: 'playing' }).where(eq(queueItems.id, loopFirst.id))
			if (session.deviceId) {
				try {
					const { accessToken } = await getValidAccessToken(authSession.user.id)
					await spotifyPlay(accessToken, session.deviceId, loopFirst.trackUri)
				} catch (err) {
					console.error('Spotify loop play error:', err)
				}
			}
			return NextResponse.json({ playing: loopFirst.id, looped: true })
		}
	}

	return NextResponse.json({ playing: null })
}
