import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const ROLES = {
  ADMIN: 'ADMIN',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  DISPATCHER: 'DISPATCHER',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
};

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    // Default organization_id to 1 if not set in old tokens
    req.orgId = decoded.organization_id || 1;
    req.user.organization_id = req.orgId;
    req.user.role = decoded.role || ROLES.DISPATCHER;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * RBAC Role Authorization Middleware
 * Usage: router.post('/...', authMiddleware, requireRole(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER), handler)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRole = req.user.role?.toUpperCase();
    const hasRole = allowedRoles.some(r => r.toUpperCase() === userRole);
    if (!hasRole && userRole !== ROLES.ADMIN) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}. Current role: ${userRole}`,
      });
    }
    next();
  };
}
