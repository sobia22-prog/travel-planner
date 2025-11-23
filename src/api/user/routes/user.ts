export default {
  routes: [
    {
      method: 'GET',
      path: '/users/me',
      handler: 'user.me',
      config: {
        auth: {
          scope: [],
        },
        policies: [],
      },
    },
  ],
};

