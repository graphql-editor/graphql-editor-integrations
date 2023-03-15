import { FieldResolveInput } from 'stucco-js';
import { getUrl } from '../S3.js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Query', 'getFile', async ({ fileKey }) => {
    const storedKeyName = fileKey;
    const fileSignedUrl = await getUrl(storedKeyName);
    return fileSignedUrl;
  })(input.arguments);
