import { describe, expect, it } from 'vitest'
import { parseTrackUri } from './spotify'

describe('parseTrackUri', () => {
	it('returns a spotify URI unchanged', () => {
		expect(parseTrackUri('spotify:track:4uLU6hMCjMI75M1A2tKUQC')).toBe(
			'spotify:track:4uLU6hMCjMI75M1A2tKUQC',
		)
	})

	it('converts a spotify.com track URL to a URI', () => {
		expect(
			parseTrackUri('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'),
		).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC')
	})

	it('handles URLs with query params', () => {
		expect(
			parseTrackUri(
				'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc123',
			),
		).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC')
	})

	it('throws on invalid input', () => {
		expect(() => parseTrackUri('https://example.com/foo')).toThrow()
	})

	it('throws on empty string', () => {
		expect(() => parseTrackUri('')).toThrow()
	})
})
