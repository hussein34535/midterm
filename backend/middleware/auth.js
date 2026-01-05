/**
 * Authentication Middleware
 * Shared JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

/**
 * Basic Auth Middleware
 * Verifies JWT and attaches user info to request
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'غير مصرح - التوكن مطلوب' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info from token
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role || 'user';

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'انتهت صلاحية التوكن' });
        }
        res.status(401).json({ error: 'التوكن غير صالح' });
    }
};

/**
 * Role-based Access Control Middleware
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(401).json({ error: 'غير مصرح' });
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                error: 'لا تملك صلاحية الوصول لهذا المورد',
                requiredRoles: allowedRoles,
                yourRole: req.userRole
            });
        }

        next();
    };
};

/**
 * Require Admin or Owner access
 */
const requireAdmin = requireRole('owner');

/**
 * Require Owner access only
 */
const requireOwner = requireRole('owner');

/**
 * Require Specialist access
 */
const requireSpecialist = requireRole('specialist', 'owner');

module.exports = {
    authMiddleware,
    requireRole,
    requireAdmin,
    requireOwner,
    requireSpecialist
};
