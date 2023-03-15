import { NewIntegration } from 'graphql-editor-cli';
import { handler as getFile } from './Query/getFile.js';
import { handler as uploadFile } from './Mutation/uploadFile.js';

export const integration = NewIntegration({
  Query: {
    getFile: {
      name: 'getFile',
      description: 'Get file cloud link by key',
      handler: getFile,
    },
  },
  Mutation: {
    uploadFile: {
      name: 'uploadFile',
      description: 'Uploading a file to the cloud, and return key',
      handler: uploadFile,
    },
  },
});

export default integration;
