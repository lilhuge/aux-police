import { auth } from '@/auth'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import type { CreateSessionBody } from '@/types'
import { NextResponse } from 'next/server'

function generateJoinCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
	let code = ''
	for (let i = 0; i < 5; i++) {
		code += chars[Math.floor(Math.random() * chars.length)]
	}
	return code
}

export async function POST(req: Request) {
	const session = await auth()

	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = (await req.json()) as CreateSessionBody
	const playbackMode = body.playbackMode ?? 'stop-on-empty'

	let joinCode = generateJoinCode()
	let attempts = 0
	while (attempts < 5) {
		const existing = await db.query.sessions.findFirst({
			where: (s, { eq }) => eq(s.joinCode, joinCode),
		})
		if (!existing) break
		joinCode = generateJoinCode()
		attempts++
	}

	const [newSession] = await db
		.insert(sessions)
		.values({
			hostUserId: session.user.id,
			joinCode,
			playbackMode,
		})
		.returning()

	return NextResponse.json({ session: newSession }, { status: 201 })
}
