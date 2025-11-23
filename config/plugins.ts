export default () => ({
  'users-permissions': {
    config: {
      jwt: {
        // Set user auth token (JWT) lifetime to 1 year
        expiresIn: '365d',
      },
    },
  },
});
