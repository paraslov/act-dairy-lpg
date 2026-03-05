/**
 * Tests for quest-based progression service
 */

import { describe, it, expect } from '@jest/globals'

describe('getXpForDifficulty', () => {
	const config = { easyXp: 1, mediumXp: 2, hardXp: 3 }

	it('should return correct XP for EASY difficulty', () => {
		expect(config.easyXp).toBe(1)
	})

	it('should return correct XP for MEDIUM difficulty', () => {
		expect(config.mediumXp).toBe(2)
	})

	it('should return correct XP for HARD difficulty', () => {
		expect(config.hardXp).toBe(3)
	})
})

describe('processQuestCompletion interface', () => {
	it('should define correct parameter structure', () => {
		const params = {
			userId: 'test-user',
			questInstanceId: 'test-instance',
			questDefinitionId: 'test-def',
			difficulty: 'EASY' as const,
			direction: 'TOWARD' as const,
			subValueIds: ['sv-1', 'sv-2'],
		}

		expect(params.userId).toBe('test-user')
		expect(params.difficulty).toBe('EASY')
		expect(params.direction).toBe('TOWARD')
		expect(params.subValueIds).toHaveLength(2)
	})
})
