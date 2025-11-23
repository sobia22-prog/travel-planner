const tripSchema = {
  kind: 'collectionType',
  collectionName: 'trips',
  info: {
    singularName: 'trip',
    pluralName: 'trips',
    displayName: 'Trip',
    description: 'User trips with generated itineraries and budgets',
  },
  options: {
    draftAndPublish: false,
  },
  attributes: {
    title: {
      type: 'string',
      required: true,
    },
    destination: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::destination.destination',
      inversedBy: 'trips',
      required: true,
    },
    startDate: {
      type: 'date',
      required: true,
    },
    endDate: {
      type: 'date',
      required: true,
    },
    durationDays: {
      type: 'integer',
    },
    totalBudget: {
      type: 'integer',
    },
    interests: {
      type: 'json',
      configurable: false,
    },
    itinerary: {
      type: 'json',
      configurable: false,
    },
    budgetBreakdown: {
      type: 'json',
      configurable: false,
    },
    owner: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'plugin::users-permissions.user',
      required: true,
    },
  },
};

export default tripSchema;
