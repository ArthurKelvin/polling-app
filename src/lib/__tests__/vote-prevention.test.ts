import { castVote, checkUserVoteStatus, getPollStats, validateVoteOperation } from '../vote-prevention'

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

describe('Vote Prevention Module', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create a fresh mock Supabase client for each test
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

  describe('castVote', () => {
    const mockPollId = '123e4567-e89b-12d3-a456-426614174000'
    const mockOptionId = '987fcdeb-51a2-43d1-9f12-345678901234'

    describe('Happy Path Tests', () => {
      it('should successfully cast a vote when all conditions are met', async () => {
        // Arrange
        const mockVoteResult = {
          success: true,
          vote_id: 'vote-123',
          message: 'Vote cast successfully',
          can_update: true
        }
        
        mockSupabase.rpc.mockResolvedValue({
          data: mockVoteResult,
          error: null
        })

        // Act
        const result = await castVote(mockPollId, mockOptionId, false)

        // Assert
        expect(result).toEqual(mockVoteResult)
        expect(mockSupabase.rpc).toHaveBeenCalledWith('cast_vote_enhanced', {
          p_poll_id: mockPollId,
          p_option_id: mockOptionId,
          p_allow_update: false
        })
        expect(mockSupabase.rpc).toHaveBeenCalledTimes(1)
      })

      it('should successfully cast a vote with update allowed', async () => {
        // Arrange
        const mockVoteResult = {
          success: true,
          vote_id: 'vote-456',
          message: 'Vote updated successfully',
          can_update: true
        }
        
        mockSupabase.rpc.mockResolvedValue({
          data: mockVoteResult,
          error: null
        })

        // Act
        const result = await castVote(mockPollId, mockOptionId, true)

        // Assert
        expect(result).toEqual(mockVoteResult)
        expect(mockSupabase.rpc).toHaveBeenCalledWith('cast_vote_enhanced', {
          p_poll_id: mockPollId,
          p_option_id: mockOptionId,
          p_allow_update: true
        })
      })
    })

    describe('Edge Cases and Error Handling', () => {
      it('should handle database error when casting vote', async () => {
        // Arrange
        const mockError = {
          message: 'Database connection failed',
          code: 'DB_ERROR'
        }
        
        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: mockError
        })

        // Act
        const result = await castVote(mockPollId, mockOptionId, false)

        // Assert
        expect(result).toEqual({
          success: false,
          error: 'Failed to cast vote',
          error_code: 'VOTE_ERROR'
        })
        expect(mockSupabase.rpc).toHaveBeenCalledTimes(1)
      })

      it('should handle network timeout error', async () => {
        // Arrange
        mockSupabase.rpc.mockRejectedValue(new Error('Network timeout'))

        // Act
        const result = await castVote(mockPollId, mockOptionId, false)

        // Assert
        expect(result).toEqual({
          success: false,
          error: 'Failed to cast vote',
          error_code: 'VOTE_ERROR'
        })
      })

      it('should handle invalid poll ID format', async () => {
        // Arrange
        const invalidPollId = 'invalid-uuid'
        const mockError = {
          message: 'Invalid poll ID format',
          code: 'INVALID_INPUT'
        }
        
        mockSupabase.rpc.mockResolvedValue({
          data: null,
          error: mockError
        })

        // Act
        const result = await castVote(invalidPollId, mockOptionId, false)

        // Assert
        expect(result).toEqual({
          success: false,
          error: 'Failed to cast vote',
          error_code: 'VOTE_ERROR'
        })
      })

      it('should handle user already voted error', async () => {
        // Arrange
        const mockVoteResult = {
          success: false,
          error: 'User has already voted on this poll',
          error_code: 'ALREADY_VOTED',
          can_update: true
        }
        
        mockSupabase.rpc.mockResolvedValue({
          data: mockVoteResult,
          error: null
        })

        // Act
        const result = await castVote(mockPollId, mockOptionId, false)

        // Assert
        expect(result).toEqual(mockVoteResult)
        expect(result.success).toBe(false)
        expect(result.error_code).toBe('ALREADY_VOTED')
      })
    })
  })

  describe('checkUserVoteStatus', () => {
    const mockPollId = '123e4567-e89b-12d3-a456-426614174000'

    it('should return true when user has voted', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      // Act
      const result = await checkUserVoteStatus(mockPollId)

      // Assert
      expect(result).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('user_has_voted', {
        p_poll_id: mockPollId
      })
    })

    it('should return false when user has not voted', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null
      })

      // Act
      const result = await checkUserVoteStatus(mockPollId)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false and log error when database call fails', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      // Act
      const result = await checkUserVoteStatus(mockPollId)

      // Assert
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Error checking vote status:', { message: 'Database error' })
      
      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('getPollStats', () => {
    const mockPollId = '123e4567-e89b-12d3-a456-426614174000'

    it('should return poll statistics when successful', async () => {
      // Arrange
      const mockStats = {
        poll_id: mockPollId,
        total_votes: 42,
        user_has_voted: true,
        user_vote_option_id: 'option-123',
        options: [
          {
            option_id: 'option-123',
            label: 'Option A',
            votes: 25,
            user_voted_for_this: true
          },
          {
            option_id: 'option-456',
            label: 'Option B',
            votes: 17,
            user_voted_for_this: false
          }
        ]
      }
      
      mockSupabase.rpc.mockResolvedValue({
        data: mockStats,
        error: null
      })

      // Act
      const result = await getPollStats(mockPollId)

      // Assert
      expect(result).toEqual(mockStats)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_poll_stats', {
        p_poll_id: mockPollId
      })
    })

    it('should return null when database call fails', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' }
      })

      // Act
      const result = await getPollStats(mockPollId)

      // Assert
      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error getting poll stats:', { message: 'Poll not found' })
      
      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('validateVoteOperation', () => {
    it('should return valid when all parameters are correct and user has not voted', () => {
      // Arrange
      const pollId = '123e4567-e89b-12d3-a456-426614174000'
      const optionId = '987fcdeb-51a2-43d1-9f12-345678901234'
      const hasVoted = false
      const allowUpdate = false

      // Act
      const result = validateVoteOperation(pollId, optionId, hasVoted, allowUpdate)

      // Assert
      expect(result).toEqual({ valid: true })
    })

    it('should return invalid when pollId is missing', () => {
      // Arrange
      const pollId = ''
      const optionId = '987fcdeb-51a2-43d1-9f12-345678901234'
      const hasVoted = false
      const allowUpdate = false

      // Act
      const result = validateVoteOperation(pollId, optionId, hasVoted, allowUpdate)

      // Assert
      expect(result).toEqual({
        valid: false,
        error: 'Poll ID and Option ID are required'
      })
    })

    it('should return invalid when optionId is missing', () => {
      // Arrange
      const pollId = '123e4567-e89b-12d3-a456-426614174000'
      const optionId = ''
      const hasVoted = false
      const allowUpdate = false

      // Act
      const result = validateVoteOperation(pollId, optionId, hasVoted, allowUpdate)

      // Assert
      expect(result).toEqual({
        valid: false,
        error: 'Poll ID and Option ID are required'
      })
    })

    it('should return invalid when user has voted and updates are not allowed', () => {
      // Arrange
      const pollId = '123e4567-e89b-12d3-a456-426614174000'
      const optionId = '987fcdeb-51a2-43d1-9f12-345678901234'
      const hasVoted = true
      const allowUpdate = false

      // Act
      const result = validateVoteOperation(pollId, optionId, hasVoted, allowUpdate)

      // Assert
      expect(result).toEqual({
        valid: false,
        error: 'You have already voted on this poll'
      })
    })

    it('should return valid when user has voted but updates are allowed', () => {
      // Arrange
      const pollId = '123e4567-e89b-12d3-a456-426614174000'
      const optionId = '987fcdeb-51a2-43d1-9f12-345678901234'
      const hasVoted = true
      const allowUpdate = true

      // Act
      const result = validateVoteOperation(pollId, optionId, hasVoted, allowUpdate)

      // Assert
      expect(result).toEqual({ valid: true })
    })
  })
})
