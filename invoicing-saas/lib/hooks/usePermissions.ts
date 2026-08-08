'use client';

import { useAuth } from '@/lib/auth/authContext';
import { PermissionKey } from '@/lib/types/invoice';

export function usePermissions() {
  const { user } = useAuth();
  const isCollaborator = !!user?.isCollaborator;

  const hasPermission = (key: PermissionKey): boolean => {
    // Super admins and company owners (non-collaborators) have all permissions
    if (!isCollaborator) return true;
    
    // If collaborator permissions are not explicitly defined, default to false for safety or true if empty fallback
    if (!user?.permissions) return true;
    
    return user.permissions.includes(key);
  };

  return {
    hasPermission,
    isCollaborator,
    permissions: user?.permissions || [],
    accessScope: user?.accessScope || 'global',
    allowedSubsidiaryIds: user?.allowedSubsidiaryIds || [],
    memberRole: user?.memberRole,
    hostCompanyEmail: user?.hostCompanyEmail,
    hostCompanyName: user?.hostCompanyName,
  };
}
