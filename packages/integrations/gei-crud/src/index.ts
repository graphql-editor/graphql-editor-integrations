import { NewIntegration } from 'graphql-editor-cli';
import create from './Mutation/create.js';
import update from './Mutation/update.js';
import createObjects from './Mutation/createObjects.js';
import updateObjects from './Mutation/updateObjects.js';
import deleteObject from './Mutation/deleteById.js';

import objects from './Query/objects.js';
import paginatedObjects from './Query/paginatedObjects.js';
import oneById from './Query/oneById.js';

import oneToOne from './Object/oneToOne.js';
import oneToMany from './Object/oneToMany.js';
export const integration = NewIntegration({
  Query: {
    objects: {
      name: 'List objects',
      description: 'List objects stored in database',
      data: {
        model: {
          name: 'Database model',
          description: 'Specify model name',
          value: 'Object',
          required: true,
        },
        sourceFilterParameters: {
          name: 'Get only owned objects by parameters from source',
          description:
            'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys in format "teamId: team._id"',
          value: [],
        },
      },
      handler: objects,
    },
    paginatedObjects: {
      name: 'List paginated Objects',
      description: 'List objects stored in database',
      data: {
        model: {
          name: 'Database model',
          description: 'Specify model name',
          value: 'Object',
          required: true,
        },
        sourceFilterParameters: {
          name: 'Get only owned objects by parameters from source',
          description:
            'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys in format "teamId: team._id"',
          value: [],
        },
      },
      handler: paginatedObjects,
    },
    oneById: {
      name: 'Get object by _id',
      description: 'Get object by _id value',
      data: {
        model: {
          name: 'Database model',
          description: 'Specify model name',
          value: 'Object',
          required: true,
        },
        sourceFilterParameters: {
          name: 'Get only owned objects by parameters from source',
          description:
            'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys',
          value: [],
        },
      },
      handler: oneById,
    },
  },
  Mutation: {
    create: {
      name: 'Create object',
      description:
        'Create object from GraphQL Input. Connect this integration to field with one input param which holds creation data.',
      data: {
        model: {
          name: 'Database model',
          description: 'Specify model name',
          value: 'Object',
          required: true,
        },
        sourceParameters: {
          name: 'Get parameters from source',
          description:
            'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys',
          value: [],
        },
      },
      handler: create,
    },
    createObjects: {
      name: 'Create objectObjects',
      description:
        'Create objectObjects from GraphQL Input. Connect this integration to field with one input param which holds creation data.',
      data: {
        model: {
          name: 'Database model',
          description: 'Specify model name',
          value: 'Object',
          required: true,
        },
        sourceParameters: {
          name: 'Get parameters from source',
          description:
            'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys',
          value: [],
        },
      },
      handler: createObjects,
    },
    update: {
      name: 'Update object',
      description:
        'Update object stored in database. This resolver requires "_id" parameter on field and one "input" type parameter with optional fields',
      data: {
        model: {
          name: 'Database model',
          description: 'Specify model name',
          value: 'Object',
          required: true,
        },
        sourceFilterParameters: {
          name: 'Get only owned objects by parameters from source',
          description:
            'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys',
          value: [],
        },
      },
      handler: update,
    },
    updateObjects: {
      name: 'Update objectObjects',
      description:
        'Update objectObjects stored in database. This resolver requires "_id" parameter on field and one "input" type parameter with optional fields',
      data: {
        model: {
          name: 'Database model',
          description: 'Specify model name',
          value: 'Object',
          required: true,
        },
        sourceFilterParameters: {
          name: 'Get only owned objects by parameters from source',
          description:
            'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys',
          value: [],
        },
      },
      handler: updateObjects,
    },
    delete: {
      name: 'Delete object',
      description: 'Delete object stored in database. This resolver requires "_id" parameter.',
      data: {
        model: {
          name: 'Database model',
          description: 'Specify model name',
          value: 'Object',
          required: true,
        },
        sourceParameters: {
          name: 'Get parameters from source',
          description:
            'Specify parameters that comes as source from previous resolver. Source must be an object, please specify its keys',
          value: [],
        },
        relatedModel: {
          name: 'Related model',
          description: 'Specify related model name',
          value: 'Object',
          required: true,
        },
        relatedField: {
          name: 'Name of the field on related objects',
          description: 'Related object has this field as an owner id.',
          value: 'owner',
        },
      },
      handler: deleteObject,
    },
  },
  Object: {
    oneToOne: {
      name: 'One to One relation',
      description:
        'Resolve one to one relation. So if you have a field "objectB" with type "ObjectB" it will unfold "ObjectB"',
      data: {
        relatedModel: {
          name: 'Related model',
          description: 'Specify related model name',
          value: 'Object',
          required: true,
        },
        relatedField: {
          name: 'Name of the field on related objects',
          description: 'Related object has this field as an owner id',
          value: 'owner',
        },
      },
      handler: oneToOne,
    },
    oneToMany: {
      name: 'One to Many relation',
      description:
        'Resolve one to many relation. So if you have a field "objectsB" with type "[ObjectB]" it will unfold "ObjectB"',
      data: {
        relatedModel: {
          name: 'Related model',
          description: 'Specify related model name',
          value: 'Object',
          required: true,
        },
        relatedField: {
          name: 'Name of the field on related objects',
          description: 'Related object has this field as an owner id.',
          value: 'owner',
        },
      },
      handler: oneToMany,
    },
  },
});

export default integration;
