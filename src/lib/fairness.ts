type FairnessInput = {
	id: string
	requestedByUserId: string
	createdAt: string
}

type FairnessOutput = {
	id: string
	position: number
}

export function computeFairPositions(items: FairnessInput[]): FairnessOutput[] {
	if (items.length === 0) return []

	const userGroups = new Map<string, FairnessInput[]>()
	const userFirstSeen = new Map<string, string>()

	for (const item of items) {
		const group = userGroups.get(item.requestedByUserId) ?? []
		group.push(item)
		userGroups.set(item.requestedByUserId, group)

		if (!userFirstSeen.has(item.requestedByUserId)) {
			userFirstSeen.set(item.requestedByUserId, item.createdAt)
		}
	}

	for (const group of userGroups.values()) {
		group.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
	}

	const sortedUserIds = [...userGroups.keys()].sort((a, b) => {
		const aFirst = userFirstSeen.get(a) ?? ''
		const bFirst = userFirstSeen.get(b) ?? ''
		return aFirst.localeCompare(bFirst)
	})

	const result: FairnessOutput[] = []
	let position = 10
	let hasItems = true

	while (hasItems) {
		hasItems = false
		for (const userId of sortedUserIds) {
			const group = userGroups.get(userId) ?? []
			if (group.length > 0) {
				const item = group.shift()
				if (item) {
					result.push({ id: item.id, position })
					position += 10
					hasItems = true
				}
			}
		}
	}

	return result
}
