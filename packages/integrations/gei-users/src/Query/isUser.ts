import { FieldResolveInput } from 'stucco-js';
import { getUserFromHandlerInput } from '../UserMiddleware.js';

export const handler = async (input: FieldResolveInput) => getUserFromHandlerInput(input);
