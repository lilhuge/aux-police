import { auth } from '@/auth'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import type { RegisterDeviceBody } from '@/types'
import { eq } from 'drizzle-orm'
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
	const body = (await req.json()) as RegisterDeviceBody
	if (!body.deviceId) {
		return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
	}
	await db.update(sessions).set({ deviceId: body.deviceId }).where(eq(sessions.id, sessionId))
	return NextResponse.json({ ok: true })
}
