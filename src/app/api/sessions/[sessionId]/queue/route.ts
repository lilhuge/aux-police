import { and, asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { queueItems, sessions } from '@/db/schema'
import { computeFairPositions } from '@/lib/fairness'
import { parseTrackUri } from '@/lib/spotify'
import type { AddTrackBody } from '@/types'

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params

	const session = await db.query.sessions.findFirst({
		where: eq(sessions.id, sessionId),
	})

	if (!session) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 })
	}

	const body = (await req.json()) as AddTrackBody

	if (!body.trackUri || !body.requestedByUserId || !body.requestedByUserName) {
		return NextResponse.json(
			{
				error:
					'trackUri, requestedByUserId, and requestedByUserName are required',
			},
			{ status: 400 },
		)
	}

	let trackUri: string
	try {
		trackUri = parseTrackUri(body.trackUri)
	} catch {
		return NextResponse.json(
			{ error: 'Invalid Spotify track URL or URI' },
			{ status: 400 },
		)
	}

	const pending = await db.query.queueItems.findMany({
		where: and(
			eq(queueItems.sessionId, sessionId),
			eq(queueItems.status, 'pending'),
		),
	})

	const maxPosition =
		pending.length > 0 ? Math.max(...pending.map(i => i.position)) : 0

	const [newItem] = await db
		.insert(queueItems)
		.values({
			sessionId,
			position: maxPosition + 10,
			trackUri,
			requestedByUserId: body.requestedByUserId,
			requestedByUserName: body.requestedByUserName,
			status: 'pending',
		})
		.returning()

	const allPending = await db.query.queueItems.findMany({
		where: and(
			eq(queueItems.sessionId, sessionId),
			eq(queueItems.status, 'pending'),
		),
		orderBy: asc(queueItems.createdAt),
	})

	const positionUpdates = computeFairPositions(
		allPending.map(i => ({
			id: i.id,
			requestedByUserId: i.requestedByUserId,
			createdAt: i.createdAt.toISOString(),
		})),
	)

	await Promise.all(
		positionUpdates.map(({ id, position }) =>
			db.update(queueItems).set({ position }).where(eq(queueItems.id, id)),
		),
	)

	return NextResponse.json(newItem, { status: 201 })
}
