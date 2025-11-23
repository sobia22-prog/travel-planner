export default {
  async me(ctx: any) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be authenticated');
    }

    try {
      // Fetch user with role populated using query API
      const userWithRole = await strapi
        .query('plugin::users-permissions.user')
        .findOne({
          where: { id: user.id },
          populate: ['role'],
        });

      if (!userWithRole) {
        return ctx.notFound('User not found');
      }

      // Return user data with role
      ctx.body = {
        id: userWithRole.id,
        username: userWithRole.username,
        email: userWithRole.email,
        role: userWithRole.role ? {
          id: userWithRole.role.id,
          name: userWithRole.role.name,
          type: userWithRole.role.type,
        } : null,
      };
    } catch (err: any) {
      ctx.throw(500, 'Failed to fetch user data', { error: err.message });
    }
  },
};

