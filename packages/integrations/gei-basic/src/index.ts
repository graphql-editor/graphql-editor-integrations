import { NewIntegration } from 'graphql-editor-cli';

import { handler as pipe } from './Query/pipe.js';
import { handler as passSource } from './Query/passSource.js';

export const integration = NewIntegration({
  Query: {
    pipe: {
      name: 'Pipe resolver',
      description: 'Pass the resolver and go furhter',
      handler: pipe,
    },
    passSource: {
      name: 'Pass the source resolver',
      description: 'Pass the resolver and go furhter. Pass the source to the next resolver',
      handler: passSource,
    },
  },
});

export default integration;
