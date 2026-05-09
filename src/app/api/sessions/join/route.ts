import { NextResponse } from 'next/server'
import { db } from '@/db'
import type { JoinSessionBody } from '@/types'

export async function POST(req: Request) {
	const body = (await req.json()) as JoinSessionBody

	if (!body.joinCode || typeof body.joinCode !== 'string') {
		return NextResponse.json({ error: 'joinCode is required' }, { status: 400 })
	}

	const session = await db.query.sessions.findFirst({
		where: (s, { eq }) => eq(s.joinCode, body.joinCode.toUpperCase()),
	})

	if (!session) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 })
	}

	return NextResponse.json({ sessionId: session.id })
}
