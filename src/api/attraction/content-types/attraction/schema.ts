const attractionSchema = {
  kind: 'collectionType',
  collectionName: 'attractions',
  info: {
    singularName: 'attraction',
    pluralName: 'attractions',
    displayName: 'Attraction',
    description: 'Attractions and points of interest within a destination',
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
    category: {
      type: 'enumeration',
      enum: ['sightseeing', 'food', 'nature', 'adventure', 'culture', 'shopping'],
      default: 'sightseeing',
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
    approximateCost: {
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
      inversedBy: 'attractions',
    },
  },
};

export default attractionSchema;
