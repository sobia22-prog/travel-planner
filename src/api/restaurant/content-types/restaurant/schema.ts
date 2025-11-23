const restaurantSchema = {
  kind: 'collectionType',
  collectionName: 'restaurants',
  info: {
    singularName: 'restaurant',
    pluralName: 'restaurants',
    displayName: 'Restaurant',
    description: 'Restaurants and food places for destinations',
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
    cuisine: {
      type: 'string',
    },
    priceLevel: {
      type: 'enumeration',
      enum: ['budget', 'midrange', 'luxury'],
      default: 'midrange',
    },
    shortDescription: {
      type: 'text',
    },
    description: {
      type: 'richtext',
    },
    latitude: {
      type: 'decimal',
    },
    longitude: {
      type: 'decimal',
    },
    averagePricePerPerson: {
      type: 'integer',
    },
    image: {
      type: 'media',
      multiple: false,
      allowedTypes: ['images'],
    },
    destination: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::destination.destination',
      inversedBy: 'restaurants',
    },
  },
};

export default restaurantSchema;
