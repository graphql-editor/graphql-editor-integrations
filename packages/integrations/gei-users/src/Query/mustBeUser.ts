import { FieldResolveInput } from 'stucco-js';
import { getUserFromHandlerInputOrThrow } from '../UserMiddleware.js';

export const mustBeUser = async (input: FieldResolveInput) => getUserFromHandlerInputOrThrow(input);
export default mustBeUser;
