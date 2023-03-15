import crypto from 'crypto';
import { FieldResolveInput } from 'stucco-js';
import { putUrl } from '../S3.js';
import { resolverFor } from '../zeus/index.js';

const genRandomString = (length: number) =>
  crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'uploadFile', async ({ fileInput: { filename, contentType } }) => {
    const pureKey = `${genRandomString(16)}-${filename}`;
    const putObjectResponse = await putUrl({ fileKey: pureKey, contentType });
    return { fileKey: pureKey, putUrl: putObjectResponse.putUrl };
  })(input.arguments);
