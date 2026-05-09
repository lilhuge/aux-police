'use client'

import { addTrack, getSessionView } from '@/lib/api'
import type { SessionView } from '@/types'
import { use, useEffect, useRef, useState } from 'react'

const GUEST_ID_KEY = 'aux_police_guest_id'
const GUEST_NAME_KEY = 'aux_police_guest_name'

function getOrCreateGuestId(): string {
	let id = localStorage.getItem(GUEST_ID_KEY)
	if (!id) {
		id = crypto.randomUUID()
		localStorage.setItem(GUEST_ID_KEY, id)
	}
	return id
}

export default function GuestPage({
	params,
}: {
	params: Promise<{ sessionId: string }>
}) {
	const { sessionId } = use(params)

	const [displayName, setDisplayName] = useState('')
	const [nameConfirmed, setNameConfirmed] = useState(false)
	const [view, setView] = useState<SessionView | null>(null)
	const [trackInput, setTrackInput] = useState('')
	const [adding, setAdding] = useState(false)
	const [addError, setAddError] = useState<string | null>(null)
	const guestIdRef = useRef<string>('')

	useEffect(() => {
		const savedName = localStorage.getItem(GUEST_NAME_KEY)
		if (savedName) {
			setDisplayName(savedName)
			setNameConfirmed(true)
			guestIdRef.current = getOrCreateGuestId()
		}
	}, [])

	useEffect(() => {
		if (!nameConfirmed) return
		let cancelled = false

		async function poll() {
			try {
				const data = await getSessionView(sessionId)
				if (!cancelled) setView(data)
			} catch {}
		}

		poll()
		const interval = setInterval(poll, 3000)
		return () => {
			cancelled = true
			clearInterval(interval)
		}
	}, [nameConfirmed, sessionId])

	function confirmName(e: React.FormEvent) {
		e.preventDefault()
		if (!displayName.trim()) return
		localStorage.setItem(GUEST_NAME_KEY, displayName.trim())
		guestIdRef.current = getOrCreateGuestId()
		setNameConfirmed(true)
	}

	async function handleAddTrack(e: React.FormEvent) {
		e.preventDefault()
		if (!trackInput.trim()) return
		setAdding(true)
		setAddError(null)
		try {
			await addTrack(sessionId, {
				trackUri: trackInput.trim(),
				requestedByUserId: `guest:${guestIdRef.current}`,
				requestedByUserName: displayName,
			})
			setTrackInput('')
		} catch {
			setAddError('Could not add track. Check the Spotify URL and try again.')
		} finally {
			setAdding(false)
		}
	}

	if (!nameConfirmed) {
		return (
			<main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-zinc-950 text-white">
				<h1 className="text-2xl font-bold">Join the queue</h1>
				<form onSubmit={confirmName} className="flex flex-col gap-3 w-full max-w-xs">
					<input
						type="text"
						value={displayName}
						onChange={e => setDisplayName(e.target.value)}
						placeholder="Your name"
						maxLength={30}
						autoFocus
						className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						disabled={!displayName.trim()}
						className="bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors"
					>
						Enter
					</button>
				</form>
			</main>
		)
	}

	return (
		<main className="min-h-screen flex flex-col gap-6 p-4 bg-zinc-950 text-white max-w-lg mx-auto">
			<header className="flex items-center justify-between pt-4">
				<h1 className="text-xl font-bold">Aux Police</h1>
				<span className="text-zinc-400 text-sm">{displayName}</span>
			</header>

			{view?.nowPlaying && (
				<section className="bg-zinc-900 rounded-xl p-4">
					<p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Now Playing</p>
					<p className="font-mono text-sm truncate">{view.nowPlaying.trackUri}</p>
					<p className="text-xs text-zinc-400 mt-1">
						Added by {view.nowPlaying.requestedByUserName}
					</p>
				</section>
			)}

			<form onSubmit={handleAddTrack} className="flex flex-col gap-2">
				<input
					type="text"
					value={trackInput}
					onChange={e => setTrackInput(e.target.value)}
					placeholder="Paste Spotify track URL or URI"
					className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				{addError && <p className="text-red-400 text-xs">{addError}</p>}
				<button
					type="submit"
					disabled={adding || !trackInput.trim()}
					className="bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors"
				>
					{adding ? 'Adding…' : 'Add to Queue'}
				</button>
			</form>

			{view?.upcoming && view.upcoming.length > 0 && (
				<section>
					<p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Up Next</p>
					<ul className="flex flex-col gap-2">
						{view.upcoming.map(item => (
							<li key={item.id} className="bg-zinc-900 rounded-lg p-3">
								<p className="font-mono text-xs truncate">{item.trackUri}</p>
								<p className="text-xs text-zinc-400 mt-0.5">
									#{item.position} · {item.requestedByUserName}
								</p>
							</li>
						))}
					</ul>
				</section>
			)}
		</main>
	)
}
