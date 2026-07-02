import { supabaseClient } from './supabase';

export type UserRole = 'admin' | 'operator';

export interface UserContext {
  userId: string;
  companyId: string;
  role: UserRole;
  email: string;
}

/**
 * Get user context from Supabase session
 * Extracts user_id, company_id, and role from JWT metadata
 */
export async function getUserContext(): Promise<UserContext | null> {
  try {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) return null;

    const userMetadata = user.user_metadata || {};
    const companyId = userMetadata.company_id;
    const role = (userMetadata.role || 'operator') as UserRole;

    if (!companyId) {
      console.error('[v0] Missing company_id in user metadata');
      return null;
    }

    return {
      userId: user.id,
      companyId,
      role,
      email: user.email || '',
    };
  } catch (error) {
    console.error('[v0] Error getting user context:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific company
 */
export async function validateCompanyAccess(companyId: string): Promise<boolean> {
  const userContext = await getUserContext();
  if (!userContext) return false;
  return userContext.companyId === companyId;
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const userContext = await getUserContext();
  return userContext ? userContext.role === 'admin' : false;
}

/**
 * Check if user has operator role
 */
export async function isOperator(): Promise<boolean> {
  const userContext = await getUserContext();
  return userContext ? userContext.role === 'operator' : false;
}

/**
 * Verify that user can access financial data (admin only)
 */
export async function canAccessFinancialData(): Promise<boolean> {
  return isAdmin();
}
