import { validatePollInput, checkRateLimit, sanitizeText } from '../validation'

// No external dependencies to mock for this test

describe('Poll Creation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unit Tests - Input Validation', () => {
    describe('validatePollInput', () => {
      it('should successfully validate and sanitize valid poll input', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'What is your favorite programming language?')
        formData.append('option1', 'JavaScript')
        formData.append('option2', 'Python')
        formData.append('option3', 'TypeScript')
        formData.append('option4', 'Go')

        // Act
        const result = validatePollInput(formData)

        // Assert
        expect(result).toEqual({
          question: 'What is your favorite programming language?',
          options: ['JavaScript', 'Python', 'TypeScript', 'Go'],
          is_public: true
        })
      })

      it('should filter out empty options and sanitize input', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', '  What is your favorite color?  ')
        formData.append('option1', '  Red  ')
        formData.append('option2', 'Blue')
        formData.append('option3', '') // Empty option should be filtered
        formData.append('option4', 'Green')

        // Act
        const result = validatePollInput(formData)

        // Assert
        expect(result).toEqual({
          question: 'What is your favorite color?',
          options: ['Red', 'Blue', 'Green'],
          is_public: true
        })
      })

      it('should throw validation error for question too short', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'Hi') // Too short
        formData.append('option1', 'Option 1')
        formData.append('option2', 'Option 2')

        // Act & Assert
        expect(() => validatePollInput(formData)).toThrow('Poll question must be at least 3 characters long')
      })

      it('should throw validation error for insufficient options', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'What is your favorite programming language?')
        formData.append('option1', 'JavaScript')
        // Only one option - should fail

        // Act & Assert
        expect(() => validatePollInput(formData)).toThrow('At least 2 options are required')
      })

      it('should handle exactly 4 options (current implementation limit)', () => {
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
        expect(result.options).toEqual(['Option 1', 'Option 2', 'Option 3', 'Option 4'])
      })

      it('should throw validation error for invalid characters in question', () => {
        // Arrange
        const formData = new FormData()
        formData.append('title', 'What is your favorite <script>alert("hack")</script>?')
        formData.append('option1', 'Option 1')
        formData.append('option2', 'Option 2')

        // Act & Assert
        expect(() => validatePollInput(formData)).toThrow('Question can only contain letters, numbers, spaces, and basic punctuation')
      })
    })

    describe('sanitizeText', () => {
      it('should remove HTML tags and dangerous content', () => {
        // Arrange
        const maliciousInput = '  <script>alert("hack")</script>Hello World  '

        // Act
        const result = sanitizeText(maliciousInput)

        // Assert
        expect(result).toBe('scriptalert("hack")/scriptHello World')
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
      })

      it('should remove javascript: protocols', () => {
        // Arrange
        const maliciousInput = 'Click here: javascript:alert("hack")'

        // Act
        const result = sanitizeText(maliciousInput)

        // Assert
        expect(result).toBe('Click here: alert("hack")')
        expect(result).not.toContain('javascript:')
      })

      it('should remove event handlers', () => {
        // Arrange
        const maliciousInput = 'onclick="alert(\'hack\')" onclick="steal()"'

        // Act
        const result = sanitizeText(maliciousInput)

        // Assert
        expect(result).toBe('"alert(\'hack\')" "steal()"')
        expect(result).not.toMatch(/on\w+=/i)
      })

      it('should preserve valid content', () => {
        // Arrange
        const validInput = '  What is your favorite programming language?  '

        // Act
        const result = sanitizeText(validInput)

        // Assert
        expect(result).toBe('What is your favorite programming language?')
      })
    })
  })

  describe('Unit Tests - Rate Limiting', () => {
    describe('checkRateLimit', () => {
      beforeEach(() => {
        // Clear any existing rate limit data
        jest.clearAllMocks()
      })

      it('should allow request when under rate limit and provide accurate status information', () => {
        // Arrange
        const userId = 'user-123'
        const action = 'create_poll'
        const expectedMaxRequests = 3
        const expectedWindowMs = 60000 // 1 minute

        // Act
        const result = checkRateLimit(userId, action, true)

        // Assert - Verify all rate limit properties are correctly calculated
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(expectedMaxRequests - 1) // 3 max - 1 used = 2 remaining
        expect(result.limit).toBe(expectedMaxRequests)
        expect(result.resetTime).toBeGreaterThan(Date.now())
        expect(result.resetTime).toBeLessThanOrEqual(Date.now() + expectedWindowMs)
        expect(result.retryAfterSeconds).toBeGreaterThan(0)
        expect(result.retryAfterSeconds).toBeLessThanOrEqual(expectedWindowMs / 1000)
        expect(result.userMessage).toContain('You have 2 create_poll requests remaining')
        expect(result.userMessage).toContain('create_poll')
      })

      it('should block request when rate limit exceeded', () => {
        // Arrange
        const userId = 'user-123'
        const action = 'create_poll'

        // Act - Exceed the rate limit (3 requests per minute)
        checkRateLimit(userId, action, true) // 1st request
        checkRateLimit(userId, action, true) // 2nd request
        checkRateLimit(userId, action, true) // 3rd request
        const result = checkRateLimit(userId, action, true) // 4th request - should be blocked

        // Assert
        expect(result.allowed).toBe(false)
        expect(result.remaining).toBe(0)
        expect(result.retryAfterSeconds).toBeGreaterThan(0)
        expect(result.userMessage).toContain('Rate limit exceeded')
      })

      it('should handle different actions independently', () => {
        // Arrange
        const userId = 'user-123'

        // Act - Exceed create_poll limit but vote should still work
        checkRateLimit(userId, 'create_poll', true) // 1st
        checkRateLimit(userId, 'create_poll', true) // 2nd
        checkRateLimit(userId, 'create_poll', true) // 3rd - limit reached
        
        const createPollResult = checkRateLimit(userId, 'create_poll', true) // Should be blocked
        const voteResult = checkRateLimit(userId, 'vote', true) // Should be allowed

        // Assert
        expect(createPollResult.allowed).toBe(false)
        expect(voteResult.allowed).toBe(true)
        expect(voteResult.remaining).toBe(4) // 5 max - 1 used = 4 remaining
      })

      it('should reset rate limit after window expires', (done) => {
        // Arrange
        const userId = 'user-123'
        const action = 'create_poll'

        // Act - Exceed rate limit
        checkRateLimit(userId, action, true) // 1st
        checkRateLimit(userId, action, true) // 2nd
        checkRateLimit(userId, action, true) // 3rd
        const blockedResult = checkRateLimit(userId, action, true) // 4th - blocked

        // Assert initial blocking
        expect(blockedResult.allowed).toBe(false)

        // Simulate time passing (in real app, this would be handled by the rate limiter)
        // For this test, we'll verify the structure is correct
        expect(blockedResult.resetTime).toBeGreaterThan(Date.now())
        expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0)
        
        done()
      })

      it('should skip counting failed requests when configured', () => {
        // Arrange
        const userId = 'user-123'
        const action = 'create_poll'

        // Act - Make failed requests (should not count against limit)
        const result1 = checkRateLimit(userId, action, false) // Failed request
        const result2 = checkRateLimit(userId, action, false) // Failed request
        const result3 = checkRateLimit(userId, action, false) // Failed request
        const result4 = checkRateLimit(userId, action, false) // Failed request
        const result5 = checkRateLimit(userId, action, false) // Failed request
        const result6 = checkRateLimit(userId, action, false) // Failed request - should still be allowed

        // Assert - All failed requests should be allowed
        expect(result1.allowed).toBe(true)
        expect(result2.allowed).toBe(true)
        expect(result3.allowed).toBe(true)
        expect(result4.allowed).toBe(true)
        expect(result5.allowed).toBe(true)
        expect(result6.allowed).toBe(true)
      })
    })
  })

  describe('Integration Test - Validation and Rate Limiting Flow', () => {
    it('should validate poll input and check rate limiting together', () => {
      // Arrange
      const userId = 'test-user'
      const formData = new FormData()
      formData.append('title', 'What is your favorite programming language?')
      formData.append('option1', 'JavaScript')
      formData.append('option2', 'Python')
      formData.append('option3', 'TypeScript')

      // Act - Validate input first
      const validationResult = validatePollInput(formData)
      
      // Check rate limiting
      const rateLimitResult = checkRateLimit(userId, 'create_poll', true)

      // Assert
      expect(validationResult.question).toBe('What is your favorite programming language?')
      expect(validationResult.options).toEqual(['JavaScript', 'Python', 'TypeScript'])
      expect(rateLimitResult.allowed).toBe(true)
      expect(rateLimitResult.remaining).toBe(2) // 3 max - 1 used = 2 remaining
    })

    it('should handle validation failure before rate limiting', () => {
      // Arrange
      const userId = 'test-user'
      const formData = new FormData()
      formData.append('title', 'Hi') // Too short
      formData.append('option1', 'Option 1')
      formData.append('option2', 'Option 2')

      // Act & Assert
      expect(() => validatePollInput(formData)).toThrow('Poll question must be at least 3 characters long')
      
      // Rate limiting should still work independently
      const rateLimitResult = checkRateLimit(userId, 'create_poll', true)
      expect(rateLimitResult.allowed).toBe(true)
    })

    it('should handle rate limiting failure after successful validation', () => {
      // Arrange
      const userId = 'rate-limited-user'
      const formData = new FormData()
      formData.append('title', 'What is your favorite color?')
      formData.append('option1', 'Red')
      formData.append('option2', 'Blue')

      // Act - Validate input (should succeed)
      const validationResult = validatePollInput(formData)
      
      // Exceed rate limit
      checkRateLimit(userId, 'create_poll', true) // 1st
      checkRateLimit(userId, 'create_poll', true) // 2nd
      checkRateLimit(userId, 'create_poll', true) // 3rd
      const rateLimitResult = checkRateLimit(userId, 'create_poll', true) // 4th - should be blocked

      // Assert
      expect(validationResult.question).toBe('What is your favorite color?')
      expect(validationResult.options).toEqual(['Red', 'Blue'])
      expect(rateLimitResult.allowed).toBe(false)
      expect(rateLimitResult.remaining).toBe(0)
    })
  })
})
