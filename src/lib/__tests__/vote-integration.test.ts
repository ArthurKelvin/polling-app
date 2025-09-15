import { castVote, checkUserVoteStatus, getPollStats } from '../vote-prevention'

// Mock the Supabase client
jest.mock('@/lib/auth/client', () => ({
  getSupabaseClient: jest.fn()
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

import { getSupabaseClient } from '@/lib/auth/client'
const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>

describe('Vote Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      rpc: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        insert: jest.fn(),
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
      auth: {
        getUser: jest.fn(),
      },
    }
    
    mockGetSupabaseClient.mockReturnValue(mockSupabase)
  })

  describe('Complete Vote Casting Flow', () => {
    const mockPollId = '123e4567-e89b-12d3-a456-426614174000'
    const mockOptionId = '987fcdeb-51a2-43d1-9f12-345678901234'

    it('should complete full vote flow: check status -> cast vote -> verify stats', async () => {
      // Arrange - Define realistic test data that represents a real poll scenario
      const initialStats = {
        poll_id: mockPollId,
        total_votes: 10,
        user_has_voted: false,
        user_vote_option_id: null,
        options: [
          {
            option_id: mockOptionId,
            label: 'Option A',
            votes: 5,
            user_voted_for_this: false
          },
          {
            option_id: 'other-option-id',
            label: 'Option B',
            votes: 5,
            user_voted_for_this: false
          }
        ]
      }

      const updatedStats = {
        poll_id: mockPollId,
        total_votes: 11,
        user_has_voted: true,
        user_vote_option_id: mockOptionId,
        options: [
          {
            option_id: mockOptionId,
            label: 'Option A',
            votes: 6,
            user_voted_for_this: true
          },
          {
            option_id: 'other-option-id',
            label: 'Option B',
            votes: 5,
            user_voted_for_this: false
          }
        ]
      }

      const voteResult = {
        success: true,
        vote_id: 'vote-123',
        message: 'Vote cast successfully',
        can_update: true
      }

      // Mock the sequence of calls with clear naming for better debugging
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: false, error: null }) // checkUserVoteStatus - user hasn't voted
        .mockResolvedValueOnce({ data: initialStats, error: null }) // getPollStats - initial state
        .mockResolvedValueOnce({ data: voteResult, error: null }) // castVote - successful vote
        .mockResolvedValueOnce({ data: true, error: null }) // checkUserVoteStatus - user has voted
        .mockResolvedValueOnce({ data: updatedStats, error: null }) // getPollStats - updated state

      // Act - Execute the complete flow with clear step documentation
      
      // Step 1: Verify user hasn't voted yet
      const hasVotedBefore = await checkUserVoteStatus(mockPollId)
      expect(hasVotedBefore).toBe(false)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('user_has_voted', { p_poll_id: mockPollId })

      // Step 2: Get initial poll statistics to establish baseline
      const initialPollStats = await getPollStats(mockPollId)
      expect(initialPollStats).toEqual(initialStats)
      expect(initialPollStats?.user_has_voted).toBe(false)
      expect(initialPollStats?.total_votes).toBe(10)
      expect(initialPollStats?.options).toHaveLength(2)

      // Step 3: Cast the vote and verify success
      const voteResult_actual = await castVote(mockPollId, mockOptionId, false)
      expect(voteResult_actual).toEqual(voteResult)
      expect(voteResult_actual.success).toBe(true)
      expect(voteResult_actual.vote_id).toBe('vote-123')
      expect(voteResult_actual.can_update).toBe(true)

      // Step 4: Verify user vote status has changed
      const hasVotedAfter = await checkUserVoteStatus(mockPollId)
      expect(hasVotedAfter).toBe(true)

      // Step 5: Get updated poll statistics and verify changes
      const updatedPollStats = await getPollStats(mockPollId)
      expect(updatedPollStats).toEqual(updatedStats)
      expect(updatedPollStats?.user_has_voted).toBe(true)
      expect(updatedPollStats?.user_vote_option_id).toBe(mockOptionId)
      expect(updatedPollStats?.total_votes).toBe(11) // Increased by 1

      // Verify the specific option that was voted for has correct data
      const votedOption = updatedPollStats?.options.find(opt => opt.option_id === mockOptionId)
      const nonVotedOption = updatedPollStats?.options.find(opt => opt.option_id === 'other-option-id')
      
      expect(votedOption).toBeDefined()
      expect(votedOption?.user_voted_for_this).toBe(true)
      expect(votedOption?.votes).toBe(6) // Increased by 1 from 5
      expect(votedOption?.label).toBe('Option A')
      
      expect(nonVotedOption).toBeDefined()
      expect(nonVotedOption?.user_voted_for_this).toBe(false)
      expect(nonVotedOption?.votes).toBe(5) // Unchanged
      expect(nonVotedOption?.label).toBe('Option B')

      // Assert - Verify all expected database calls were made in correct order
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(5)
      
      // Verify the exact sequence of database calls with detailed assertions
      const rpcCalls = mockSupabase.rpc.mock.calls
      expect(rpcCalls[0]).toEqual(['user_has_voted', { p_poll_id: mockPollId }])
      expect(rpcCalls[1]).toEqual(['get_poll_stats', { p_poll_id: mockPollId }])
      expect(rpcCalls[2]).toEqual(['cast_vote_enhanced', {
        p_poll_id: mockPollId,
        p_option_id: mockOptionId,
        p_allow_update: false
      }])
      expect(rpcCalls[3]).toEqual(['user_has_voted', { p_poll_id: mockPollId }])
      expect(rpcCalls[4]).toEqual(['get_poll_stats', { p_poll_id: mockPollId }])
    })

    it('should handle vote update flow when user has already voted', async () => {
      // Arrange - User has already voted and wants to update
      const initialStats = {
        poll_id: mockPollId,
        total_votes: 10,
        user_has_voted: true,
        user_vote_option_id: 'old-option-id',
        options: [
          {
            option_id: 'old-option-id',
            label: 'Old Option',
            votes: 6,
            user_voted_for_this: true
          },
          {
            option_id: mockOptionId,
            label: 'New Option',
            votes: 4,
            user_voted_for_this: false
          }
        ]
      }

      const updatedStats = {
        poll_id: mockPollId,
        total_votes: 10, // Same total, but vote moved
        user_has_voted: true,
        user_vote_option_id: mockOptionId,
        options: [
          {
            option_id: 'old-option-id',
            label: 'Old Option',
            votes: 5, // Decreased by 1
            user_voted_for_this: false
          },
          {
            option_id: mockOptionId,
            label: 'New Option',
            votes: 5, // Increased by 1
            user_voted_for_this: true
          }
        ]
      }

      const voteUpdateResult = {
        success: true,
        vote_id: 'vote-456',
        message: 'Vote updated successfully',
        can_update: true
      }

      // Mock the sequence of calls
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null }) // checkUserVoteStatus
        .mockResolvedValueOnce({ data: initialStats, error: null }) // getPollStats (initial)
        .mockResolvedValueOnce({ data: voteUpdateResult, error: null }) // castVote with update
        .mockResolvedValueOnce({ data: true, error: null }) // checkUserVoteStatus (after update)
        .mockResolvedValueOnce({ data: updatedStats, error: null }) // getPollStats (after update)

      // Act - Execute the vote update flow
      
      // Step 1: Check if user has already voted
      const hasVotedBefore = await checkUserVoteStatus(mockPollId)
      expect(hasVotedBefore).toBe(true)

      // Step 2: Get current poll statistics
      const initialPollStats = await getPollStats(mockPollId)
      expect(initialPollStats?.user_has_voted).toBe(true)
      expect(initialPollStats?.user_vote_option_id).toBe('old-option-id')

      // Step 3: Update the vote (allow update)
      const voteResult = await castVote(mockPollId, mockOptionId, true)
      expect(voteResult).toEqual(voteUpdateResult)
      expect(voteResult.success).toBe(true)

      // Step 4: Verify vote status after update
      const hasVotedAfter = await checkUserVoteStatus(mockPollId)
      expect(hasVotedAfter).toBe(true)

      // Step 5: Get updated poll statistics
      const updatedPollStats = await getPollStats(mockPollId)
      expect(updatedPollStats?.user_vote_option_id).toBe(mockOptionId)
      
      // Verify vote counts were updated correctly
      const oldOption = updatedPollStats?.options.find(opt => opt.option_id === 'old-option-id')
      const newOption = updatedPollStats?.options.find(opt => opt.option_id === mockOptionId)
      
      expect(oldOption?.votes).toBe(5) // Decreased by 1
      expect(oldOption?.user_voted_for_this).toBe(false)
      expect(newOption?.votes).toBe(5) // Increased by 1
      expect(newOption?.user_voted_for_this).toBe(true)

      // Assert - Verify all expected calls were made
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(5)
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(3, 'cast_vote_enhanced', {
        p_poll_id: mockPollId,
        p_option_id: mockOptionId,
        p_allow_update: true
      })
    })

    it('should handle error scenarios in the complete flow', async () => {
      // Arrange - Mock error scenarios
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: false, error: null }) // checkUserVoteStatus succeeds
        .mockResolvedValueOnce({ data: null, error: { message: 'Poll not found' } }) // getPollStats fails
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } }) // castVote fails

      // Act - Execute the flow with errors
      
      // Step 1: Check vote status (succeeds)
      const hasVoted = await checkUserVoteStatus(mockPollId)
      expect(hasVoted).toBe(false)

      // Step 2: Get poll stats (fails)
      const pollStats = await getPollStats(mockPollId)
      expect(pollStats).toBeNull()

      // Step 3: Attempt to cast vote (fails)
      const voteResult = await castVote(mockPollId, mockOptionId, false)
      expect(voteResult.success).toBe(false)
      expect(voteResult.error).toBe('Failed to cast vote')
      expect(voteResult.error_code).toBe('VOTE_ERROR')

      // Assert - Verify error logging
      expect(consoleSpy).toHaveBeenCalledWith('Error getting poll stats:', { message: 'Poll not found' })
      expect(consoleSpy).toHaveBeenCalledWith('Error casting vote:', { message: 'Database error' })

      // Cleanup
      consoleSpy.mockRestore()
    })
  })
})
