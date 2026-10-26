const { verifyToken } = require('../utils/auth.util');
const { sendError } = require('../utils/response');
const { db } = require('../db/connection');

function authenticate(req, res, next) {
  let token = null;

  // Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return sendError(res, 'Invalid or expired session. Please log in again.', 401);
  }

  // Fetch user from DB to verify active status
  try {
    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return sendError(res, 'Account not found.', 401);
    }

    if (user.status !== 'active') {
      return sendError(res, 'Your account is currently inactive.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return sendError(res, 'Authentication failed due to server error.', 500);
  }
}

/**
 * Role-Based Access Control (RBAC)
 * e.g., requireRole('student') or requireRole('recruiter', 'admin')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        403
      );
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
