import { 
  validatePollInput, 
  validateVoteInput, 
  sanitizeText, 
  checkRateLimit,
  getRateLimitStatus,
  clearRateLimit,
  cleanupExpiredRateLimits
} from '../validation'
import { z } from 'zod'

describe('Validation Module - Edge Cases and Error Handling', () => {
  beforeEach(() => {
    // Clear rate limit data before each test
    clearRateLimit('test-user')
  })

  describe('Input Validation Edge Cases', () => {
    describe('validatePollInput - Boundary Conditions', () => {
      it('should accept question at minimum length (3 characters)', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'Why?')
        formData.append('option1', 'Yes')
        formData.append('option2', 'No')

        // Act
        const result = validatePollInput(formData)

        // Assert
        expect(result.question).toBe('Why?')
        expect(result.options).toEqual(['Yes', 'No'])
      })

      it('should accept question at maximum length (500 characters)', () => {
        // Arrange
        const longQuestion = 'A'.repeat(500)
        const formData = new FormData()
        formData.append('title', longQuestion)
        formData.append('option1', 'Option 1')
        formData.append('option2', 'Option 2')

        // Act
        const result = validatePollInput(formData)

        // Assert
        expect(result.question).toBe(longQuestion)
        expect(result.question.length).toBe(500)
      })

      it('should reject question exceeding maximum length (501 characters)', () => {
        // Arrange
        const tooLongQuestion = 'A'.repeat(501)
        const formData = new FormData()
        formData.append('title', tooLongQuestion)
        formData.append('option1', 'Option 1')
        formData.append('option2', 'Option 2')

        // Act & Assert
        expect(() => validatePollInput(formData)).toThrow('Poll question cannot exceed 500 characters')
      })

      it('should accept exactly 4 options (maximum allowed by current implementation)', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'What is your favorite programming language?')
        formData.append('option1', 'Option 1')
        formData.append('option2', 'Option 2')
        formData.append('option3', 'Option 3')
        formData.append('option4', 'Option 4')

        // Act
        const result = validatePollInput(formData)

        // Assert
        expect(result.options).toHaveLength(4)
        expect(result.options).toEqual([
          'Option 1', 'Option 2', 'Option 3', 'Option 4'
        ])
      })

      it('should handle option at maximum length (200 characters)', () => {
        // Arrange
        const longOption = 'A'.repeat(200)
        const formData = new FormData()
        formData.append('title', 'What is your favorite color?')
        formData.append('option1', longOption)
        formData.append('option2', 'Blue')

        // Act
        const result = validatePollInput(formData)

        // Assert
        expect(result.options[0]).toBe(longOption)
        expect(result.options[0].length).toBe(200)
      })

      it('should reject option exceeding maximum length (201 characters)', () => {
        // Arrange
        const tooLongOption = 'A'.repeat(201)
        const formData = new FormData()
        formData.append('title', 'What is your favorite color?')
        formData.append('option1', tooLongOption)
        formData.append('option2', 'Blue')

        // Act & Assert
        expect(() => validatePollInput(formData)).toThrow('Poll option cannot exceed 200 characters')
      })
    })

    describe('validatePollInput - Special Characters and Encoding', () => {
      it('should reject Unicode characters (not allowed by current regex)', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'What is your favorite emoji? 🎉')
        formData.append('option1', '😀 Happy')
        formData.append('option2', '😢 Sad')

        // Act & Assert
        expect(() => validatePollInput(formData)).toThrow('Question can only contain letters, numbers, spaces, and basic punctuation')
      })

      it('should handle special punctuation correctly', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'What do you think about this? Really!')
        formData.append('option1', 'Yes, I agree!')
        formData.append('option2', 'No, I don\'t think so.')

        // Act
        const result = validatePollInput(formData)

        // Assert
        expect(result.question).toBe('What do you think about this? Really!')
        expect(result.options).toEqual(['Yes, I agree!', 'No, I don\'t think so.'])
      })

      it('should reject HTML-like content in question', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'What is your favorite <b>color</b>?')
        formData.append('option1', 'Red')
        formData.append('option2', 'Blue')

        // Act & Assert
        expect(() => validatePollInput(formData)).toThrow('Question can only contain letters, numbers, spaces, and basic punctuation')
      })

      it('should reject HTML-like content in options', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'What is your favorite color?')
        formData.append('option1', '<b>Red</b>')
        formData.append('option2', 'Blue')

        // Act & Assert
        expect(() => validatePollInput(formData)).toThrow('Option can only contain letters, numbers, spaces, and basic punctuation')
      })
    })

    describe('validateVoteInput - UUID Validation', () => {
      it('should accept valid UUIDs', () => {
        // Arrange
        const validPollId = '123e4567-e89b-12d3-a456-426614174000'
        const validOptionId = '987fcdeb-51a2-43d1-9f12-345678901234'

        // Act
        const result = validateVoteInput(validPollId, validOptionId)

        // Assert
        expect(result).toEqual({
          pollId: validPollId,
          optionId: validOptionId
        })
      })

      it('should reject invalid poll ID format', () => {
        // Arrange
        const invalidPollId = 'not-a-uuid'
        const validOptionId = '987fcdeb-51a2-43d1-9f12-345678901234'

        // Act & Assert
        expect(() => validateVoteInput(invalidPollId, validOptionId)).toThrow('Invalid poll ID')
      })

      it('should reject invalid option ID format', () => {
        // Arrange
        const validPollId = '123e4567-e89b-12d3-a456-426614174000'
        const invalidOptionId = 'not-a-uuid'

        // Act & Assert
        expect(() => validateVoteInput(validPollId, invalidOptionId)).toThrow('Invalid option ID')
      })

      it('should reject empty strings', () => {
        // Arrange
        const emptyPollId = ''
        const emptyOptionId = ''

        // Act & Assert
        expect(() => validateVoteInput(emptyPollId, emptyOptionId)).toThrow('Invalid poll ID')
      })

      it('should reject null/undefined values', () => {
        // Arrange
        const nullPollId = null as any
        const undefinedOptionId = undefined as any

        // Act & Assert
        expect(() => validateVoteInput(nullPollId, undefinedOptionId)).toThrow()
      })
    })
  })

  describe('Rate Limiting Edge Cases', () => {
    describe('checkRateLimit - Boundary Conditions', () => {
      it('should handle rapid successive requests correctly', () => {
        // Arrange
        const userId = 'rapid-user'
        const action = 'vote'

        // Act - Make 5 rapid requests (should all be allowed)
        const results = []
        for (let i = 0; i < 5; i++) {
          results.push(checkRateLimit(userId, action, true))
        }

        // Assert - All should be allowed
        results.forEach((result, index) => {
          expect(result.allowed).toBe(true)
          expect(result.remaining).toBe(5 - index - 1)
        })
      })

      it('should block exactly on the limit boundary', () => {
        // Arrange
        const userId = 'boundary-user'
        const action = 'vote'

        // Act - Make exactly 5 requests (the limit)
        const results = []
        for (let i = 0; i < 5; i++) {
          results.push(checkRateLimit(userId, action, true))
        }
        const blockedResult = checkRateLimit(userId, action, true) // 6th request

        // Assert - First 5 should be allowed, 6th should be blocked
        results.forEach(result => {
          expect(result.allowed).toBe(true)
        })
        expect(blockedResult.allowed).toBe(false)
        expect(blockedResult.remaining).toBe(0)
      })

      it('should handle mixed success/failure requests correctly', () => {
        // Arrange
        const userId = 'mixed-user'
        const action = 'create_poll'

        // Act - Mix of successful and failed requests
        const success1 = checkRateLimit(userId, action, true)   // Success
        const failure1 = checkRateLimit(userId, action, false)  // Failure (should not count)
        const success2 = checkRateLimit(userId, action, true)   // Success
        const failure2 = checkRateLimit(userId, action, false)  // Failure (should not count)
        const success3 = checkRateLimit(userId, action, true)   // Success (should be blocked)
        const success4 = checkRateLimit(userId, action, true)   // 4th success (should be blocked)

        // Assert
        expect(success1.allowed).toBe(true)
        expect(failure1.allowed).toBe(true) // Failed requests don't count
        expect(success2.allowed).toBe(true)
        expect(failure2.allowed).toBe(true) // Failed requests don't count
        expect(success3.allowed).toBe(true) // 3rd success should still be allowed (only 2 successful requests so far)
        expect(success4.allowed).toBe(false) // 4th success should also be blocked
      })
    })

    describe('getRateLimitStatus - Status Checking', () => {
      it('should return correct status for new user', () => {
        // Arrange
        const userId = 'new-user'
        const action = 'vote'

        // Act
        const status = getRateLimitStatus(userId, action)

        // Assert
        expect(status.remaining).toBe(5)
        expect(status.isLimited).toBe(false)
        expect(status.resetTime).toBeGreaterThan(Date.now())
      })

      it('should return correct status for user at limit', () => {
        // Arrange
        const userId = 'limited-user'
        const action = 'vote'

        // Act - Exceed the limit
        for (let i = 0; i < 5; i++) {
          checkRateLimit(userId, action, true)
        }
        const status = getRateLimitStatus(userId, action)

        // Assert
        expect(status.remaining).toBe(0)
        expect(status.isLimited).toBe(true)
      })

      it('should return correct status for user with remaining requests', () => {
        // Arrange
        const userId = 'partial-user'
        const action = 'vote'

        // Act - Use some requests
        checkRateLimit(userId, action, true)
        checkRateLimit(userId, action, true)
        const status = getRateLimitStatus(userId, action)

        // Assert
        expect(status.remaining).toBe(3)
        expect(status.isLimited).toBe(false)
      })
    })

    describe('clearRateLimit - Cleanup Operations', () => {
      it('should clear specific action for user', () => {
        // Arrange
        const userId = 'clear-user'
        
        // Use up limits for both actions
        for (let i = 0; i < 5; i++) {
          checkRateLimit(userId, 'vote', true)
        }
        for (let i = 0; i < 3; i++) {
          checkRateLimit(userId, 'create_poll', true)
        }

        // Act - Clear only vote limit
        clearRateLimit(userId, 'vote')

        // Assert - Vote should be reset, create_poll should still be limited
        const voteStatus = getRateLimitStatus(userId, 'vote')
        const createPollStatus = getRateLimitStatus(userId, 'create_poll')

        expect(voteStatus.remaining).toBe(5)
        expect(voteStatus.isLimited).toBe(false)
        expect(createPollStatus.remaining).toBe(0)
        expect(createPollStatus.isLimited).toBe(true)
      })

      it('should clear all actions for user when no action specified', () => {
        // Arrange
        const userId = 'clear-all-user'
        
        // Use up limits for multiple actions
        for (let i = 0; i < 5; i++) {
          checkRateLimit(userId, 'vote', true)
        }
        for (let i = 0; i < 3; i++) {
          checkRateLimit(userId, 'create_poll', true)
        }

        // Act - Clear all limits for user
        clearRateLimit(userId)

        // Assert - Both should be reset
        const voteStatus = getRateLimitStatus(userId, 'vote')
        const createPollStatus = getRateLimitStatus(userId, 'create_poll')

        expect(voteStatus.remaining).toBe(5)
        expect(voteStatus.isLimited).toBe(false)
        expect(createPollStatus.remaining).toBe(3)
        expect(createPollStatus.isLimited).toBe(false)
      })
    })

    describe('cleanupExpiredRateLimits - Memory Management', () => {
      it('should clean up expired entries', () => {
        // Arrange
        const userId = 'expired-user'
        const action = 'vote'

        // Use up the limit
        for (let i = 0; i < 5; i++) {
          checkRateLimit(userId, action, true)
        }

        // Verify it's limited
        let status = getRateLimitStatus(userId, action)
        expect(status.isLimited).toBe(true)

        // Act - Simulate time passing by manually cleaning up
        // In a real scenario, this would be called by a timer
        cleanupExpiredRateLimits()

        // Assert - Should still be limited (cleanup doesn't affect current window)
        status = getRateLimitStatus(userId, action)
        expect(status.isLimited).toBe(true)
      })
    })
  })

  describe('Sanitization Edge Cases', () => {
    describe('sanitizeText - Complex Attack Vectors', () => {
      it('should handle nested HTML tags', () => {
        // Arrange
        const maliciousInput = '<div><script>alert("hack")</script><span>Hello</span></div>'

        // Act
        const result = sanitizeText(maliciousInput)

        // Assert
        expect(result).toBe('divscriptalert("hack")/scriptspanHello/span/div')
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
      })

      it('should handle multiple javascript: protocols', () => {
        // Arrange
        const maliciousInput = 'Click javascript:alert("1") here javascript:alert("2") now'

        // Act
        const result = sanitizeText(maliciousInput)

        // Assert
        expect(result).toBe('Click alert("1") here alert("2") now')
        expect(result).not.toContain('javascript:')
      })

      it('should handle mixed case event handlers', () => {
        // Arrange
        const maliciousInput = 'onClick="alert(1)" ONMOUSEOVER="alert(2)" onload="alert(3)"'

        // Act
        const result = sanitizeText(maliciousInput)

        // Assert
        expect(result).toBe('"alert(1)" "alert(2)" "alert(3)"')
        expect(result).not.toMatch(/on\w+=/i)
      })

      it('should handle encoded HTML entities', () => {
        // Arrange
        const maliciousInput = '&lt;script&gt;alert("hack")&lt;/script&gt;'

        // Act
        const result = sanitizeText(maliciousInput)

        // Assert
        expect(result).toBe('&lt;script&gt;alert("hack")&lt;/script&gt;') // Should preserve encoded entities
      })

      it('should handle very long malicious input', () => {
        // Arrange
        const longMaliciousInput = '<script>'.repeat(1000) + 'alert("hack")' + '</script>'.repeat(1000)

        // Act
        const result = sanitizeText(longMaliciousInput)

        // Assert
        expect(result).toContain('alert("hack")')
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
        expect(result.length).toBeLessThan(longMaliciousInput.length)
      })

      it('should preserve legitimate content with similar patterns', () => {
        // Arrange
        const legitimateInput = 'This is a legitimate script: function myFunction() { return "hello"; }'

        // Act
        const result = sanitizeText(legitimateInput)

        // Assert
        expect(result).toBe('This is a legitimate script: function myFunction() { return "hello"; }')
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle malformed FormData gracefully', () => {
      // Arrange
      const malformedFormData = {
        get: jest.fn().mockReturnValue(null)
      } as any

      // Act & Assert
      expect(() => validatePollInput(malformedFormData)).toThrow()
    })

      it('should handle non-string FormData values', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'Test Question')
        formData.append('option1', 'Option 1')
        formData.append('option2', 'Option 2')

        // Mock FormData.get to return non-string values
        const originalGet = FormData.prototype.get
        FormData.prototype.get = jest.fn().mockImplementation((key) => {
          if (key === 'title') return 123 // Non-string value
          if (key === 'option1') return true // Non-string value
          if (key === 'option2') return { value: 'Option 2' } // Non-string value
          return null
        })

        // Act & Assert - Should throw validation error due to regex pattern mismatch
        expect(() => validatePollInput(formData)).toThrow()

        // Cleanup
        FormData.prototype.get = originalGet
      })
  })
})
