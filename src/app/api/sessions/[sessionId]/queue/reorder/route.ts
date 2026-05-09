import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { queueItems, sessions } from '@/db/schema'
import type { ReorderQueueBody } from '@/types'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params

	const authSession = await auth()
	if (!authSession?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const session = await db.query.sessions.findFirst({
		where: eq(sessions.id, sessionId),
	})

	if (!session || session.hostUserId !== authSession.user.id) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const body = (await req.json()) as ReorderQueueBody

	if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
		return NextResponse.json(
			{ error: 'orderedIds must be a non-empty array' },
			{ status: 400 },
		)
	}

	await Promise.all(
		body.orderedIds.map((id, index) =>
			db
				.update(queueItems)
				.set({ position: (index + 1) * 10 })
				.where(eq(queueItems.id, id)),
		),
	)

	return NextResponse.json({ ok: true })
}
