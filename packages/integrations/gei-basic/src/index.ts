import { NewIntegration } from 'graphql-editor-cli';

import pipe from './Query/pipe.js';
import passSource from './Query/passSource.js';
import passSourceWithArgs from './Query/passSourceWithArgs.js';

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
