/**
 * Poll Client Usage Examples
 * 
 * This file demonstrates how to use the poll client functions
 * in various scenarios with proper error handling and best practices.
 */

import { 
  castVote, 
  getPollResults, 
  getBasicPollResults, 
  checkUserVoteStatus, 
  getPollWithStats, 
  getVoteErrorMessage, 
  validateVoteData 
} from '../poll-client'

// Example 1: Basic vote casting with error handling
export async function exampleCastVote() {
  const pollId = '123e4567-e89b-12d3-a456-426614174000'
  const optionId = '987fcdeb-51a2-43d1-9f12-345678901234'

  try {
    // Validate input before casting vote
    const validation = validateVoteData(pollId, optionId)
    if (!validation.valid) {
      console.error('Validation failed:', validation.error)
      return
    }

    // Cast the vote
    const result = await castVote(pollId, optionId)
    
    if (result.success) {
      console.log('Vote cast successfully!', result.message)
      console.log('Vote ID:', result.voteId)
      console.log('Can update:', result.canUpdate)
    } else {
      console.error('Vote failed:', getVoteErrorMessage(result.errorCode))
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Example 2: Getting poll results and displaying them
export async function exampleGetPollResults() {
  const pollId = '123e4567-e89b-12d3-a456-426614174000'

  try {
    // Get comprehensive poll statistics
    const stats = await getPollResults(pollId)
    
    if (!stats) {
      console.error('Failed to fetch poll results')
      return
    }

    console.log(`Poll: ${pollId}`)
    console.log(`Total votes: ${stats.total_votes}`)
    console.log(`User has voted: ${stats.user_has_voted}`)
    
    if (stats.user_has_voted) {
      console.log(`User voted for option: ${stats.user_vote_option_id}`)
    }

    // Display option results
    stats.options.forEach(option => {
      const percentage = stats.total_votes > 0 
        ? (option.votes / stats.total_votes) * 100 
        : 0
      
      console.log(`${option.label}: ${option.votes} votes (${percentage.toFixed(1)}%)`)
      if (option.user_voted_for_this) {
        console.log('  ← You voted for this option')
      }
    })
  } catch (error) {
    console.error('Error fetching poll results:', error)
  }
}

// Example 3: Complete poll display with voting functionality
export async function exampleCompletePollDisplay() {
  const pollId = '123e4567-e89b-12d3-a456-426614174000'

  try {
    // Get complete poll data with statistics
    const poll = await getPollWithStats(pollId)
    
    if (!poll) {
      console.error('Poll not found')
      return
    }

    console.log(`\n=== ${poll.question} ===`)
    console.log(`Created: ${new Date(poll.created_at).toLocaleDateString()}`)
    console.log(`Total votes: ${poll.total_votes}`)
    console.log(`Public: ${poll.is_public ? 'Yes' : 'No'}`)

    // Display options
    console.log('\nOptions:')
    poll.poll_options.forEach((option, index) => {
      const percentage = poll.total_votes > 0 
        ? (option.votes || 0) / poll.total_votes * 100 
        : 0
      
      console.log(`${index + 1}. ${option.label} (${percentage.toFixed(1)}%)`)
    })

    // Check if user has voted
    if (poll.user_has_voted) {
      console.log(`\nYou have already voted for: ${poll.user_vote_option_id}`)
    } else {
      console.log('\nYou have not voted yet.')
    }
  } catch (error) {
    console.error('Error displaying poll:', error)
  }
}

// Example 4: Voting with update capability
export async function exampleVoteWithUpdate() {
  const pollId = '123e4567-e89b-12d3-a456-426614174000'
  const newOptionId = '987fcdeb-51a2-43d1-9f12-345678901234'

  try {
    // Check if user has already voted
    const hasVoted = await checkUserVoteStatus(pollId)
    
    if (hasVoted) {
      console.log('User has already voted. Updating vote...')
      
      // Update existing vote
      const result = await castVote(pollId, newOptionId, true) // allowUpdate = true
      
      if (result.success) {
        console.log('Vote updated successfully!')
      } else {
        console.error('Failed to update vote:', getVoteErrorMessage(result.errorCode))
      }
    } else {
      console.log('User has not voted. Casting new vote...')
      
      // Cast new vote
      const result = await castVote(pollId, newOptionId, false)
      
      if (result.success) {
        console.log('Vote cast successfully!')
      } else {
        console.error('Failed to cast vote:', getVoteErrorMessage(result.errorCode))
      }
    }
  } catch (error) {
    console.error('Error in voting process:', error)
  }
}

// Example 5: Real-time poll monitoring
export async function exampleRealTimePollMonitoring() {
  const pollId = '123e4567-e89b-12d3-a456-426614174000'

  try {
    // Get initial results
    let previousStats = await getPollResults(pollId)
    
    if (!previousStats) {
      console.error('Failed to fetch initial poll results')
      return
    }

    console.log('Starting real-time poll monitoring...')
    console.log(`Initial total votes: ${previousStats.total_votes}`)

    // Monitor for changes (in a real app, you'd use WebSocket or polling)
    const monitorInterval = setInterval(async () => {
      const currentStats = await getPollResults(pollId)
      
      if (!currentStats) {
        console.error('Failed to fetch poll results')
        return
      }

      // Check if vote count changed
      if (currentStats.total_votes !== previousStats.total_votes) {
        console.log(`Vote count changed: ${previousStats.total_votes} → ${currentStats.total_votes}`)
        
        // Find which option gained votes
        currentStats.options.forEach(currentOption => {
          const previousOption = previousStats.options.find(
            opt => opt.option_id === currentOption.option_id
          )
          
          if (previousOption && currentOption.votes > previousOption.votes) {
            console.log(`${currentOption.label} gained a vote!`)
          }
        })
        
        previousStats = currentStats
      }
    }, 5000) // Check every 5 seconds

    // Stop monitoring after 5 minutes (for demo purposes)
    setTimeout(() => {
      clearInterval(monitorInterval)
      console.log('Stopped monitoring poll changes')
    }, 300000)
  } catch (error) {
    console.error('Error in real-time monitoring:', error)
  }
}

// Example 6: Error handling and retry logic
export async function exampleVoteWithRetry() {
  const pollId = '123e4567-e89b-12d3-a456-426614174000'
  const optionId = '987fcdeb-51a2-43d1-9f12-345678901234'
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Vote attempt ${attempt}/${maxRetries}`)
      
      const result = await castVote(pollId, optionId)
      
      if (result.success) {
        console.log('Vote successful!')
        return
      } else {
        console.error(`Vote failed (attempt ${attempt}):`, getVoteErrorMessage(result.errorCode))
        
        // Don't retry for certain error types
        if (result.errorCode === 'AUTH_REQUIRED' || result.errorCode === 'ALREADY_VOTED') {
          console.log('Non-retryable error, stopping attempts')
          break
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
          console.log(`Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    } catch (error) {
      console.error(`Unexpected error (attempt ${attempt}):`, error)
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed')
      }
    }
  }
}

// Example 7: Batch operations
export async function exampleBatchOperations() {
  const pollIds = [
    '123e4567-e89b-12d3-a456-426614174000',
    '987fcdeb-51a2-43d1-9f12-345678901234',
    '456789ab-cdef-1234-5678-90abcdef1234'
  ]

  try {
    console.log('Fetching multiple polls...')
    
    // Fetch all polls in parallel
    const pollPromises = pollIds.map(pollId => getPollWithStats(pollId))
    const polls = await Promise.all(pollPromises)
    
    // Filter out null results
    const validPolls = polls.filter(poll => poll !== null)
    
    console.log(`Successfully fetched ${validPolls.length} polls`)
    
    // Display summary
    validPolls.forEach(poll => {
      console.log(`\n${poll.question}`)
      console.log(`  Votes: ${poll.total_votes}`)
      console.log(`  Options: ${poll.poll_options.length}`)
      console.log(`  User voted: ${poll.user_has_voted ? 'Yes' : 'No'}`)
    })
  } catch (error) {
    console.error('Error in batch operations:', error)
  }
}
