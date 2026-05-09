import { auth } from '@/auth'
import { db } from '@/db'
import { queueItems, sessions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(
	req: Request,
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
	const body = (await req.json()) as { trackUri: string }
	if (!body.trackUri) {
		return NextResponse.json({ error: 'trackUri required' }, { status: 400 })
	}
	const item = await db.query.queueItems.findFirst({
		where: and(
			eq(queueItems.sessionId, sessionId),
			eq(queueItems.trackUri, body.trackUri),
			eq(queueItems.status, 'pending'),
		),
		orderBy: (qi, { asc }) => asc(qi.position),
	})
	if (item) {
		await db.update(queueItems).set({ status: 'playing' }).where(eq(queueItems.id, item.id))
	}
	return NextResponse.json({ ok: true })
}
