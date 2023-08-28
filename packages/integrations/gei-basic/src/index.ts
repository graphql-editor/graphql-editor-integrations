import { NewIntegration } from 'graphql-editor-cli';

import { handler as pipe } from './Query/pipe.js';
import { handler as passSource } from './Query/passSource.js';
import { handler as passSourceWithArgs } from './Query/passSourceWithArgs.js';

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
    passSourceWithArgs: {
      name: 'Pass the source with args resolver',
      description: 'Pass the resolver and go furhter. Pass the source and arguments to the next resolver',
      handler: passSourceWithArgs,
    },
  },
});

export default integration;
