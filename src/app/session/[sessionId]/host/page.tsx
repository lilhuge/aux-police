'use client'

import { getSessionView, getSpotifyAccessToken, notifyTrackFinished, registerDevice, skipTrack } from '@/lib/api'
import type { SessionView } from '@/types'
import { use, useEffect, useRef, useState } from 'react'

declare global {
	interface Window {
		onSpotifyWebPlaybackSDKReady: () => void
		Spotify: {
			Player: new (options: {
				name: string
				getOAuthToken: (cb: (token: string) => void) => void
				volume: number
			}) => SpotifyPlayer
		}
	}
}

type SpotifyPlayer = {
	connect: () => Promise<boolean>
	disconnect: () => void
	addListener: (event: string, cb: (state: unknown) => void) => void
	getCurrentState: () => Promise<SpotifyState | null>
}

type SpotifyState = {
	paused: boolean
	position: number
	duration: number
	track_window: {
		current_track: { uri: string; name: string; artists: { name: string }[] }
	}
}

export default function HostPage({ params }: { params: Promise<{ sessionId: string }> }) {
	const { sessionId } = use(params)

	const [view, setView] = useState<SessionView | null>(null)
	const [deviceId, setDeviceId] = useState<string | null>(null)
	const [desync, setDesync] = useState(false)
	const [sdkReady, setSdkReady] = useState(false)

	const playerRef = useRef<SpotifyPlayer | null>(null)
	const wasPlayingRef = useRef(false)
	const notifyingRef = useRef(false)
	const viewRef = useRef<SessionView | null>(null)

	useEffect(() => {
		viewRef.current = view
	}, [view])

	useEffect(() => {
		let cancelled = false
		async function poll() {
			try {
				const data = await getSessionView(sessionId)
				if (!cancelled) setView(data)
			} catch {}
		}
		poll()
		const id = setInterval(poll, 3000)
		return () => {
			cancelled = true
			clearInterval(id)
		}
	}, [sessionId])

	useEffect(() => {
		if (document.getElementById('spotify-sdk')) {
			if (window.Spotify) setSdkReady(true)
			return
		}
		window.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true)
		const script = document.createElement('script')
		script.id = 'spotify-sdk'
		script.src = 'https://sdk.scdn.co/spotify-player.js'
		script.async = true
		document.body.appendChild(script)
	}, [])

	useEffect(() => {
		if (!sdkReady) return

		const player = new window.Spotify.Player({
			name: 'Aux Police',
			getOAuthToken: async cb => {
				try {
					const token = await getSpotifyAccessToken()
					cb(token)
				} catch {
					console.error('Failed to get Spotify token')
				}
			},
			volume: 0.8,
		})

		player.addListener('ready', (state: unknown) => {
			const { device_id } = state as { device_id: string }
			setDeviceId(device_id)
			registerDevice(sessionId, { deviceId: device_id }).catch(console.error)
		})

		player.addListener('player_state_changed', (state: unknown) => {
			if (!state) return
			const s = state as SpotifyState

			if (!s.paused) {
				wasPlayingRef.current = true
			} else if (s.paused && s.position === 0 && wasPlayingRef.current) {
				wasPlayingRef.current = false
				if (!notifyingRef.current) {
					notifyingRef.current = true
					notifyTrackFinished(sessionId)
						.catch(console.error)
						.finally(() => {
							notifyingRef.current = false
						})
				}
				return
			}

			const currentUri = s.track_window?.current_track?.uri
			const expectedUri = viewRef.current?.nowPlaying?.trackUri
			if (currentUri && expectedUri && currentUri !== expectedUri && !s.paused) {
				setDesync(true)
			} else {
				setDesync(false)
			}
		})

		player.connect()
		playerRef.current = player

		return () => {
			player.disconnect()
		}
	}, [sdkReady, sessionId])

	async function handleSkip() {
		await skipTrack(sessionId)
		const data = await getSessionView(sessionId)
		setView(data)
	}

	async function handleResync() {
		setDesync(false)
		const data = await getSessionView(sessionId)
		setView(data)
	}

	return (
		<main className="min-h-screen flex flex-col gap-6 p-4 bg-zinc-950 text-white max-w-lg mx-auto">
			<header className="flex items-center justify-between pt-4">
				<h1 className="text-xl font-bold">Aux Police — Host</h1>
				<span className="text-xs text-zinc-500">
					{deviceId ? `SDK: ${deviceId.slice(0, 8)}…` : 'Connecting SDK…'}
				</span>
			</header>

			{desync && (
				<div className="bg-yellow-900 border border-yellow-700 rounded-xl p-4 flex items-center justify-between">
					<p className="text-sm text-yellow-200">
						Playback changed outside Aux Police.
					</p>
					<button
						type="button"
						onClick={handleResync}
						className="text-xs bg-yellow-700 hover:bg-yellow-600 rounded px-3 py-1 transition-colors"
					>
						Re-sync
					</button>
				</div>
			)}

			{view?.nowPlaying ? (
				<section className="bg-zinc-900 rounded-xl p-4">
					<p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Now Playing</p>
					<p className="font-mono text-sm truncate">{view.nowPlaying.trackUri}</p>
					<p className="text-xs text-zinc-400 mt-1">
						Added by {view.nowPlaying.requestedByUserName}
					</p>
					<button
						type="button"
						onClick={handleSkip}
						className="mt-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
					>
						Skip
					</button>
				</section>
			) : (
				<section className="bg-zinc-900 rounded-xl p-4 text-zinc-500 text-sm">
					Queue is empty. Guests can add tracks using code:{' '}
					<span className="text-white font-mono font-bold">
						{view?.session?.joinCode ?? '…'}
					</span>
				</section>
			)}

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
