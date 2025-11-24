// src/middlewares/auth.ts
export default (config, { strapi }) => {
    return async (ctx, next) => {
        // Define public routes that don't require authentication
        const publicRoutes = [
            // Auth routes
            { path: '/api/auth/', method: 'ALL' },
            // Public API routes
            { path: '/api/destinations', method: 'GET' },
            { path: '/api/attractions', method: 'GET' },
            { path: '/api/hotels', method: 'GET' },
            { path: '/api/restaurants', method: 'GET' },
            // Uploads directory
            { path: '/uploads/', method: 'ALL' },
            // Trip planning without saving
            {
                path: '/api/trips/plan',
                method: 'POST',
                checkBody: (body) => !body?.saveTrip
            }
        ];

        // Check if current request matches any public route
        const isPublicRoute = publicRoutes.some(route => {
            const pathMatches = ctx.request.url.startsWith(route.path);
            const methodMatches = route.method === 'ALL' || ctx.request.method === route.method;
            const bodyCheck = route.checkBody ? route.checkBody(ctx.request.body) : true;
            return pathMatches && methodMatches && bodyCheck;
        });

        if (isPublicRoute) {
            return next();
        }

        // For all other routes, require authentication

        const authHeader = ctx.request.header.authorization;
        console.log('Auth header:', authHeader); // Debug log

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No or invalid auth header'); // Debug log
            return ctx.unauthorized('No token provided or invalid format');
        }

        const token = authHeader.split(' ')[1];
        try {
            console.log('Verifying token...'); // Debug log
            const { id } = await strapi.plugins['users-permissions'].services.jwt.verify(token);

            console.log('Token verified, user ID:', id); // Debug log
            const user = await strapi.entityService.findOne('plugin::users-permissions.user', id, {
                populate: ['role'],
            });

            if (!user) {
                console.log('User not found for ID:', id); // Debug log
                return ctx.unauthorized('Invalid token: User not found');
            }

            console.log('User authenticated:', user.id, user.email); // Debug log
            ctx.state.user = user;
            return next();
        } catch (err) {
            console.error('Auth error:', err);
            return ctx.unauthorized('Invalid or expired token');
        }
    };
};