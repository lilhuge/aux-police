import { db } from '@/db'
import { queueItems, sessions } from '@/db/schema'
import { buildSessionView } from '@/lib/session'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params

	const session = await db.query.sessions.findFirst({
		where: eq(sessions.id, sessionId),
	})

	if (!session) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 })
	}

	const items = await db.query.queueItems.findMany({
		where: eq(queueItems.sessionId, sessionId),
	})

	const view = buildSessionView(session, items)

	return NextResponse.json(view)
}
