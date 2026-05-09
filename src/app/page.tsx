'use client'

import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { useState } from 'react'
import { joinSession } from '@/lib/api'

export default function HomePage() {
	const router = useRouter()
	const { data: session, status } = useSession()
	const [joinCode, setJoinCode] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [joining, setJoining] = useState(false)

	async function handleJoin(e: React.FormEvent) {
		e.preventDefault()
		if (!joinCode.trim()) return
		setJoining(true)
		setError(null)
		try {
			const { sessionId } = await joinSession({ joinCode: joinCode.trim() })
			router.push(`/session/${sessionId}/guest`)
		} catch {
			setError('Session not found. Check the code and try again.')
		} finally {
			setJoining(false)
		}
	}

	async function handleCreateSession() {
		if (status !== 'authenticated') {
			await signIn('spotify')
			return
		}
		const res = await fetch('/api/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playbackMode: 'stop-on-empty' }),
		})
		if (res.ok) {
			const data = (await res.json()) as { session: { id: string } }
			router.push(`/session/${data.session.id}/host`)
		}
	}

	return (
		<main className='min-h-screen flex flex-col items-center justify-center gap-10 p-6 bg-zinc-950 text-white'>
			<div className='flex flex-col items-center gap-2'>
				<h1 className='text-4xl font-bold tracking-tight'>Aux Police</h1>
				<p className='text-zinc-400 text-sm'>Fair queue for party music</p>
			</div>

			<form
				onSubmit={handleJoin}
				className='flex flex-col gap-3 w-full max-w-xs'
			>
				<input
					type='text'
					value={joinCode}
					onChange={e => setJoinCode(e.target.value.toUpperCase())}
					placeholder='Enter join code'
					maxLength={6}
					className='bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center text-xl tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
				{error && <p className='text-red-400 text-sm text-center'>{error}</p>}
				<button
					type='submit'
					disabled={joining || !joinCode.trim()}
					className='bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors'
				>
					{joining ? 'Joining…' : 'Join Session'}
				</button>
			</form>

			<div className='flex flex-col items-center gap-2'>
				<p className='text-zinc-500 text-xs uppercase tracking-widest'>or</p>
				<button
					type='button'
					onClick={handleCreateSession}
					className='border border-zinc-600 hover:border-zinc-400 rounded-lg px-6 py-3 font-semibold text-zinc-300 hover:text-white transition-colors'
				>
					{status === 'authenticated'
						? `Start Session (${session?.user?.name ?? 'Host'})`
						: 'Sign in with Spotify to host'}
				</button>
			</div>
		</main>
	)
}
