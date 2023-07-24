type IntegrationData = {
  name: string;
  description: string;
  value: string | string[];
  required?: boolean;
};

type IntegrationSpecification = {
  [resolver: string]: {
    name: string;
    description: string;
    data: Record<string, IntegrationData>;
    resolve: { name: string };
  };
};

const model: IntegrationData = {
  name: 'Database model',
  description: 'Specify model name',
  value: 'Object',
  required: true,
};

const relatedModel: IntegrationData = {
  name: 'Related model',
  description: 'Specify related model name',
  value: 'Object',
  required: true,
};

const relatedField: IntegrationData = {
  name: 'Name of the field on related objects',
  description: 'Related object has this field as an owner id',
  value: 'owner',
};

const sourceFilterParameters: IntegrationData = {
  name: 'Get only owned objects by parameters from source',
  description:
    'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys',
  value: [],
};

const integration: IntegrationSpecification = {
  'Query.objects': {
    name: 'List objects',
    description: 'List objects stored in database',
    data: {
      model,
      sourceFilterParameters,
    },
    resolve: {
      name: 'lib/Query/objects',
    },
  },
  'Query.oneById': {
    name: 'Get object by _id',
    description: 'Get object by _id value',
    data: {
      model,
      sourceFilterParameters,
    },
    resolve: {
      name: 'lib/Query/oneById',
    },
  },
  'Mutation.create': {
    name: 'Create object',
    description:
      'Create object from GraphQL Input. Connect this integration to field with one input param which holds creation data.',
    data: {
      model,
      sourceParameters: {
        name: 'Get parameters from source',
        description:
          'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys',
        value: [],
      },
    },
    resolve: {
      name: 'lib/Mutation/create',
    },
  },
  'Mutation.update': {
    name: 'Update object',
    description:
      'Update object stored in database. This resolver requires "_id" parameter on field and one "input" type parameter with optional fields',
    data: {
      model,
      sourceFilterParameters,
    },
    resolve: {
      name: 'lib/Mutation/update',
    },
  },
  'Mutation.delete': {
    name: 'Delete object',
    description: 'Delete object stored in database. This resolver requires "_id" parameter.',
    data: {
      model,
      sourceFilterParameters,
    },
    resolve: {
      name: 'lib/Mutation/delete',
    },
  },
  'Object.oneToOne': {
    name: 'One to One relation',
    description:
      'Resolve one to one relation. So if you have a field "objectB" with type "ObjectB" it will unfold "ObjectB"',
    data: {
      relatedModel,
      relatedField,
    },
    resolve: {
      name: 'lib/Object/oneToOne',
    },
  },
  'Object.oneToMany': {
    name: 'One to Many relation',
    description:
      'Resolve one to many relation. So if you have a field "objectsB" with type "[ObjectB]" it will unfold "ObjectB"',
    data: {
      relatedModel,
      relatedField,
    },
    resolve: {
      name: 'lib/Object/oneToMany',
    },
  },
};

export default integration;
