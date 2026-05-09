import { describe, expect, it } from 'vitest'
import { computeFairPositions } from './fairness'

type Input = { id: string; requestedByUserId: string; createdAt: string }

describe('computeFairPositions', () => {
	it('assigns sequential positions to single-user queue', () => {
		const items: Input[] = [
			{
				id: 'a',
				requestedByUserId: 'user1',
				createdAt: '2024-01-01T00:00:00Z',
			},
			{
				id: 'b',
				requestedByUserId: 'user1',
				createdAt: '2024-01-01T00:01:00Z',
			},
			{
				id: 'c',
				requestedByUserId: 'user1',
				createdAt: '2024-01-01T00:02:00Z',
			},
		]
		const result = computeFairPositions(items)
		expect(result).toEqual([
			{ id: 'a', position: 10 },
			{ id: 'b', position: 20 },
			{ id: 'c', position: 30 },
		])
	})

	it('interleaves two users round-robin', () => {
		const items: Input[] = [
			{
				id: 'a',
				requestedByUserId: 'user1',
				createdAt: '2024-01-01T00:00:00Z',
			},
			{
				id: 'b',
				requestedByUserId: 'user1',
				createdAt: '2024-01-01T00:01:00Z',
			},
			{
				id: 'c',
				requestedByUserId: 'user2',
				createdAt: '2024-01-01T00:02:00Z',
			},
			{
				id: 'd',
				requestedByUserId: 'user2',
				createdAt: '2024-01-01T00:03:00Z',
			},
		]
		const result = computeFairPositions(items)
		const order = result.sort((a, b) => a.position - b.position).map(r => r.id)
		expect(order).toEqual(['a', 'c', 'b', 'd'])
	})

	it('interleaves three users round-robin', () => {
		const items: Input[] = [
			{ id: 'a', requestedByUserId: 'u1', createdAt: '2024-01-01T00:00:00Z' },
			{ id: 'b', requestedByUserId: 'u2', createdAt: '2024-01-01T00:01:00Z' },
			{ id: 'c', requestedByUserId: 'u3', createdAt: '2024-01-01T00:02:00Z' },
			{ id: 'd', requestedByUserId: 'u1', createdAt: '2024-01-01T00:03:00Z' },
			{ id: 'e', requestedByUserId: 'u2', createdAt: '2024-01-01T00:04:00Z' },
		]
		const result = computeFairPositions(items)
		const order = result.sort((a, b) => a.position - b.position).map(r => r.id)
		expect(order).toEqual(['a', 'b', 'c', 'd', 'e'])
	})

	it('handles single item', () => {
		const items: Input[] = [
			{
				id: 'x',
				requestedByUserId: 'user1',
				createdAt: '2024-01-01T00:00:00Z',
			},
		]
		const result = computeFairPositions(items)
		expect(result).toEqual([{ id: 'x', position: 10 }])
	})

	it('returns empty array for empty input', () => {
		expect(computeFairPositions([])).toEqual([])
	})
})
