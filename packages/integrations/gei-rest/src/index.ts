import { NewIntegration } from 'graphql-editor-cli';
import { handler } from './rest.js';

export const integration = NewIntegration({
  Query: {
    restProxy: {
      name: 'gei-rest',
      description: 'Proxy your rest endpoint to GraphQL Schema',
      handler,
      data: {
        passedHeaders: {
          name: 'Passed headers',
          description: 'Names of headers to pass from `/graphql` request to rest proxy',
          value: [],
        },
        headers: {
          name: 'Request headers',
          description: 'Insert request headers for REST in format Key:Value',
          value: [],
        },
        body: {
          name: 'REST endpoint body',
          description: 'REST endpoint body serialized as JSON.',
          value: '',
        },
        url: {
          name: 'REST endpoint',
          description: 'REST endpoint to map to. Accepts values with $ at the beginning from the GraphQL Query.',
          value: 'https://jsonplaceholder.typicode.com/todos/1',
          required: true,
        },
        method: {
          name: 'method',
          description: 'GET, POST, PUT etc.',
          value: 'GET',
        },
      },
    },
  },
});

export default integration;
