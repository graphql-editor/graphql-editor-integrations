import { FieldResolveInput } from 'stucco-js';
import { getUserFromHandlerInput } from '../UserMiddleware.js';

export const isUser = async (input: FieldResolveInput) => getUserFromHandlerInput(input);
export default isUser;
