const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

/**
 * Maintenance Mode Middleware
 * Checks if the system is in maintenance mode.
 * Allows Admin login and Settings access (to disable it).
 * Allows authenticated Admins/Owners to bypass maintenance.
 */
const checkMaintenanceMode = async (req, res, next) => {
    // Whitelist paths that should ALWAYS be accessible
    const allowedPaths = [
        '/api/auth/login', // To let admin login
        '/api/health',     // Health checks
        '/api/settings'    // To let admin turn OFF maintenance
    ];

    // Check if current path starts with any allowed path
    if (allowedPaths.some(path => req.originalUrl.startsWith(path))) {
        return next();
    }

    // Check for Admin/Owner Bypass via JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === 'admin' || decoded.role === 'owner') {
                // Allow access for staff
                return next();
            }
        } catch (err) {
            // Invalid token, proceed to maintenance check
        }
    }

    try {
        // Fetch maintenance setting
        const { data: setting } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .single();

        const isMaintenance = setting?.value === true || setting?.value === 'true';

        if (isMaintenance) {
            return res.status(503).json({
                error: 'النظام تحت الصيانة حالياً',
                maintenance: true
            });
        }

        next();
    } catch (error) {
        console.error('Maintenance check error:', error);
        next();
    }
};

module.exports = checkMaintenanceMode;
