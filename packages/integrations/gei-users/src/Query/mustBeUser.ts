import { FieldResolveInput } from 'stucco-js';
import { getUserFromHandlerInputOrThrow } from '../UserMiddleware.js';

export const handler = async (input: FieldResolveInput) => getUserFromHandlerInputOrThrow(input);
