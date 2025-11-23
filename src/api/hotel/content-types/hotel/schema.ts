const hotelSchema = {
  kind: 'collectionType',
  collectionName: 'hotels',
  info: {
    singularName: 'hotel',
    pluralName: 'hotels',
    displayName: 'Hotel',
    description: 'Hotels and accommodations for destinations',
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
    stars: {
      type: 'integer',
    },
    pricePerNight: {
      type: 'integer',
      required: true,
    },
    isBudgetFriendly: {
      type: 'boolean',
      default: false,
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
    image: {
      type: 'media',
      multiple: false,
      allowedTypes: ['images'],
    },
    destination: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::destination.destination',
      inversedBy: 'hotels',
    },
  },
};

export default hotelSchema;
