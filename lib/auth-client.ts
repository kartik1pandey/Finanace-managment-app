// Client-side auth utilities
export function createAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export interface AuthUser {
  id: string
  email: string
  user_metadata?: any
}