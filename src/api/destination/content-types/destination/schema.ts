const destinationSchema = {
  kind: 'collectionType',
  collectionName: 'destinations',
  info: {
    singularName: 'destination',
    pluralName: 'destinations',
    displayName: 'Destination',
    description: 'Travel destinations / cities users can plan trips to',
  },
  options: {
    draftAndPublish: true,
  },
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    slug: {
      type: 'uid',
      targetField: 'name',
      required: true,
    },
    country: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'richtext',
    },
    image: {
      type: 'media',
      multiple: false,
      allowedTypes: ['images'],
    },
    latitude: {
      type: 'decimal',
    },
    longitude: {
      type: 'decimal',
    },
    averageDailyBudget: {
      type: 'integer',
      configurable: false,
    },
    attractions: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::attraction.attraction',
      mappedBy: 'destination',
    },
    hotels: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::hotel.hotel',
      mappedBy: 'destination',
    },
    restaurants: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::restaurant.restaurant',
      mappedBy: 'destination',
    },
    trips: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::trip.trip',
      mappedBy: 'destination',
    },
  },
};

export default destinationSchema;
