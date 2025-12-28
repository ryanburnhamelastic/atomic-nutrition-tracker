/**
 * User entity - synced with Clerk authentication
 */
export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generic API response wrapper
 * Use this for all API calls to handle errors consistently
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Input type for creating a user
 */
export interface CreateUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Input type for updating a user
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
}

// TODO: Add your application-specific types here
// Example:
// export interface Item {
//   id: string;
//   user_id: string;
//   name: string;
//   description: string | null;
//   created_at: string;
//   updated_at: string;
// }
