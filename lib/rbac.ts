import { NextRequest, NextResponse } from 'next/server';
import { getUserContext, UserRole } from './auth';

/**
 * API Route middleware for role-based access control
 * Usage: withRoleCheck(handler, ['admin'])
 */
export async function withRoleCheck(
  handler: (req: NextRequest) => Promise<NextResponse>,
  requiredRoles: UserRole[],
) {
  return async (req: NextRequest) => {
    try {
      const userContext = await getUserContext();

      if (!userContext) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!requiredRoles.includes(userContext.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 },
        );
      }

      // Attach user context to request for use in handler
      (req as any).userContext = userContext;

      return handler(req);
    } catch (error) {
      console.error('[v0] RBAC check failed:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}

/**
 * Get user context from request object (set by withRoleCheck middleware)
 */
export function getUserContextFromRequest(req: NextRequest) {
  return (req as any).userContext;
}

/**
 * Filter visible metrics based on user role
 * Admins see all data; Operators see only operational metrics
 */
export function filterMetricsByRole(
  metrics: any,
  role: UserRole,
): any {
  if (role === 'admin') {
    return metrics; // Admin sees everything
  }

  // Operator: remove financial data
  const { monthly_cost, energy_price, ...filtered } = metrics;
  return filtered;
}

/**
 * Check if a specific data field is accessible by role
 */
export function canAccessField(fieldName: string, role: UserRole): boolean {
  // Financial fields (admin only)
  const financialFields = ['monthly_cost', 'energy_price', 'monthly_costs', 'price'];

  if (financialFields.some((field) => fieldName.toLowerCase().includes(field))) {
    return role === 'admin';
  }

  // All other fields accessible to both roles
  return true;
}

/**
 * Build SQL WHERE clause for company-scoped queries
 */
export function getScopeFilterForQuery(companyId: string): string {
  return `company_id = '${companyId}'`;
}
