import { 
  castVote, 
  getPollResults, 
  getBasicPollResults, 
  checkUserVoteStatus, 
  getPollWithStats, 
  getVoteErrorMessage, 
  validateVoteData 
} from '../poll-client'

// Mock the Supabase client
jest.mock('@/lib/auth/client', () => ({
  getSupabaseClient: jest.fn()
}))

import { getSupabaseClient } from '@/lib/auth/client'

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>

describe('Poll Client Functions', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create a fresh mock Supabase client for each test
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      rpc: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }
    
    mockGetSupabaseClient.mockReturnValue(mockSupabase)
  })

  describe('castVote', () => {
    const mockPollId = '123e4567-e89b-12d3-a456-426614174000'
    const mockOptionId = '987fcdeb-51a2-43d1-9f12-345678901234'

    it('should successfully cast a vote when user is authenticated', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockVoteResult = {
        success: true,
        vote_id: 'vote-123',
        message: 'Vote cast successfully',
        can_update: true
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: mockVoteResult,
        error: null
      })

      // Act
      const result = await castVote(mockPollId, mockOptionId)

      // Assert
      expect(result).toEqual(mockVoteResult)
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cast_vote_enhanced', {
        p_poll_id: mockPollId,
        p_option_id: mockOptionId,
        p_allow_update: false
      })
    })

    it('should return error when user is not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      // Act
      const result = await castVote(mockPollId, mockOptionId)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'You must be logged in to vote',
        errorCode: 'AUTH_REQUIRED'
      })
    })

    it('should return error for invalid input parameters', async () => {
      // Act
      const result = await castVote('', mockOptionId)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Poll ID and Option ID are required',
        errorCode: 'INVALID_INPUT'
      })
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      // Act
      const result = await castVote(mockPollId, mockOptionId)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to cast vote',
        errorCode: 'VOTE_ERROR'
      })
    })

    it('should handle unexpected errors', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'))

      // Act
      const result = await castVote(mockPollId, mockOptionId)

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred while voting',
        errorCode: 'UNEXPECTED_ERROR'
      })
    })
  })

  describe('getPollResults', () => {
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
      const result = await getPollResults(mockPollId)

      // Assert
      expect(result).toEqual(mockStats)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_poll_stats', {
        p_poll_id: mockPollId
      })
    })

    it('should return null when poll ID is invalid', async () => {
      // Act
      const result = await getPollResults('')

      // Assert
      expect(result).toBeNull()
    })

    it('should return null when database error occurs', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' }
      })

      // Act
      const result = await getPollResults(mockPollId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getBasicPollResults', () => {
    const mockPollId = '123e4567-e89b-12d3-a456-426614174000'

    it('should return basic poll results when successful', async () => {
      // Arrange
      const mockResults = [
        {
          poll_id: mockPollId,
          option_id: 'option-123',
          label: 'Option A',
          votes_count: 25
        },
        {
          poll_id: mockPollId,
          option_id: 'option-456',
          label: 'Option B',
          votes_count: 17
        }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockResults,
        error: null
      })

      // Act
      const result = await getBasicPollResults(mockPollId)

      // Assert
      expect(result).toEqual(mockResults)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_poll_results', {
        p_poll_id: mockPollId
      })
    })

    it('should return empty array when poll ID is invalid', async () => {
      // Act
      const result = await getBasicPollResults('')

      // Assert
      expect(result).toEqual([])
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

    it('should return false when poll ID is invalid', async () => {
      // Act
      const result = await checkUserVoteStatus('')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getPollWithStats', () => {
    const mockPollId = '123e4567-e89b-12d3-a456-426614174000'

    it('should return complete poll data with statistics', async () => {
      // Arrange
      const mockPollData = {
        id: mockPollId,
        question: 'What is your favorite color?',
        owner_id: 'user-123',
        is_public: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        poll_options: [
          {
            id: 'option-123',
            label: 'Red',
            position: 0,
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'option-456',
            label: 'Blue',
            position: 1,
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      }

      const mockStats = {
        poll_id: mockPollId,
        total_votes: 10,
        user_has_voted: true,
        user_vote_option_id: 'option-123',
        options: []
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockPollData,
              error: null
            })
          }))
        }))
      })

      mockSupabase.rpc.mockResolvedValue({
        data: mockStats,
        error: null
      })

      // Act
      const result = await getPollWithStats(mockPollId)

      // Assert
      expect(result).toEqual({
        ...mockPollData,
        poll_options: mockPollData.poll_options,
        total_votes: mockStats.total_votes,
        user_has_voted: mockStats.user_has_voted,
        user_vote_option_id: mockStats.user_vote_option_id
      })
    })

    it('should return null when poll ID is invalid', async () => {
      // Act
      const result = await getPollWithStats('')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getVoteErrorMessage', () => {
    it('should return appropriate error messages for different error codes', () => {
      expect(getVoteErrorMessage('AUTH_REQUIRED')).toBe('You must be logged in to vote.')
      expect(getVoteErrorMessage('ALREADY_VOTED')).toBe('You have already voted on this poll.')
      expect(getVoteErrorMessage('POLL_NOT_FOUND')).toBe('This poll does not exist or is no longer available.')
      expect(getVoteErrorMessage('INVALID_OPTION')).toBe('The selected option is not valid for this poll.')
      expect(getVoteErrorMessage('INVALID_INPUT')).toBe('Invalid poll ID or option ID provided.')
      expect(getVoteErrorMessage('VOTE_ERROR')).toBe('An error occurred while processing your vote. Please try again.')
      expect(getVoteErrorMessage('UNEXPECTED_ERROR')).toBe('An unexpected error occurred. Please try again.')
      expect(getVoteErrorMessage('UNKNOWN_ERROR')).toBe('Unable to process your vote. Please try again.')
    })
  })

  describe('validateVoteData', () => {
    const validPollId = '123e4567-e89b-12d3-a456-426614174000'
    const validOptionId = '987fcdeb-51a2-43d1-9f12-345678901234'

    it('should return valid for correct UUIDs', () => {
      // Act
      const result = validateVoteData(validPollId, validOptionId)

      // Assert
      expect(result).toEqual({ valid: true })
    })

    it('should return invalid for missing poll ID', () => {
      // Act
      const result = validateVoteData('', validOptionId)

      // Assert
      expect(result).toEqual({
        valid: false,
        error: 'Poll ID and Option ID are required'
      })
    })

    it('should return invalid for missing option ID', () => {
      // Act
      const result = validateVoteData(validPollId, '')

      // Assert
      expect(result).toEqual({
        valid: false,
        error: 'Poll ID and Option ID are required'
      })
    })

    it('should return invalid for malformed poll ID', () => {
      // Act
      const result = validateVoteData('invalid-uuid', validOptionId)

      // Assert
      expect(result).toEqual({
        valid: false,
        error: 'Invalid poll ID format'
      })
    })

    it('should return invalid for malformed option ID', () => {
      // Act
      const result = validateVoteData(validPollId, 'invalid-uuid')

      // Assert
      expect(result).toEqual({
        valid: false,
        error: 'Invalid option ID format'
      })
    })
  })
})
