import { AuthError } from '@/lib/errors';

/**
 * Validate user ownership of a resource
 * 
 * This utility helps ensure users can only access resources they own,
 * providing an additional security layer beyond RLS policies.
 * 
 * @param userId - ID of the user to validate
 * @param resourceOwnerId - ID of the resource owner
 * @param resourceType - Type of resource for better error messages
 * @throws AuthError if user doesn't own the resource
 */
export function validateResourceOwnership(
  userId: string,
  resourceOwnerId: string,
  resourceType: string = 'resource'
): void {
  if (userId !== resourceOwnerId) {
    throw new AuthError(
      `You don't have permission to access this ${resourceType}`,
      'permission'
    );
  }
}
