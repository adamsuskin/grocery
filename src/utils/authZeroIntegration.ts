/**
 * Auth-Zero Integration Utilities
 *
 * This module provides integration between the AuthContext and Zero store,
 * ensuring that Zero client credentials are synchronized with authentication state.
 */

import { initializeZeroWithAuth, logoutZero, refreshZeroAuth } from '../zero-store';
import type { User } from '../types/auth';

/**
 * Initialize Zero client with authentication credentials
 * Call this after successful login to sync Zero with auth state
 *
 * @param user - Authenticated user object
 * @param token - JWT access token
 */
export async function syncZeroWithLogin(user: User, token: string): Promise<void> {
  try {
    await initializeZeroWithAuth({
      userID: user.id,
      token,
    });
    console.log('[Auth-Zero] Synchronized Zero with login for user:', user.id);
  } catch (error) {
    console.error('[Auth-Zero] Failed to sync Zero with login:', error);
    throw new Error('Failed to initialize Zero with authentication');
  }
}

/**
 * Reset Zero client to demo mode
 * Call this after logout to clear user data
 */
export async function syncZeroWithLogout(): Promise<void> {
  try {
    await logoutZero();
    console.log('[Auth-Zero] Synchronized Zero with logout');
  } catch (error) {
    console.error('[Auth-Zero] Failed to sync Zero with logout:', error);
    // Don't throw - logout should succeed even if Zero cleanup fails
  }
}

/**
 * Update Zero client with refreshed token
 * Call this after token refresh to keep Zero in sync
 *
 * @param newToken - New JWT access token
 */
export async function syncZeroWithTokenRefresh(newToken: string): Promise<void> {
  try {
    await refreshZeroAuth(newToken);
    console.log('[Auth-Zero] Synchronized Zero with token refresh');
  } catch (error) {
    console.error('[Auth-Zero] Failed to sync Zero with token refresh:', error);
    throw new Error('Failed to refresh Zero authentication');
  }
}

/**
 * Get authorization header for API requests
 *
 * @param token - JWT access token
 * @returns Authorization header object
 */
export function getAuthHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Check if a token is expired
 *
 * @param expiresAt - Unix timestamp in milliseconds
 * @returns true if token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}

/**
 * Calculate time until token expiry
 *
 * @param expiresAt - Unix timestamp in milliseconds
 * @returns Milliseconds until expiry (0 if already expired)
 */
export function getTimeUntilExpiry(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}
