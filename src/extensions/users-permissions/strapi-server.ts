export default (plugin: any) => {
  // Override the local login controller to include role in response
  const originalLocal = plugin.controllers.auth.local;

  plugin.controllers.auth.local = async (ctx: any) => {
    // Call the original local login
    await originalLocal(ctx);

    // If login was successful, populate role in the response
    if (ctx.body && ctx.body.user && ctx.body.jwt) {
      const userId = ctx.body.user.id;
      
      try {
        // Fetch user with role populated using entityService
        const userWithRole = await strapi.entityService.findOne(
          'plugin::users-permissions.user',
          userId,
          { populate: ['role'] }
        );

        if (userWithRole && userWithRole.role) {
          ctx.body.user.role = {
            id: userWithRole.role.id,
            name: userWithRole.role.name,
            type: userWithRole.role.type,
          };
        }
      } catch (err) {
        console.error('Error fetching user role in login extension:', err);
        // Continue without role if fetch fails
      }
    }
  };

  return plugin;
};

