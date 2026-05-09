import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getValidAccessToken } from '@/lib/spotify'

export async function GET() {
	const session = await auth()

	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const { accessToken } = await getValidAccessToken(session.user.id)
		return NextResponse.json({ accessToken })
	} catch {
		return NextResponse.json(
			{ error: 'Failed to get access token' },
			{ status: 500 },
		)
	}
}
