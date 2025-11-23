export default {
  routes: [
    {
      method: 'POST',
      path: '/trips/plan',
      handler: 'trip.plan',
      config: {
        auth: false, // Allow public access - authentication only required when saving
        policies: [],
      },
    },
  ],
};


