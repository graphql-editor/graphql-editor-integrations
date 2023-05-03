import { orm } from './../db/orm.js';

import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Query', 'showInviteTokens', async (_, input) => {
    const o = await orm();
    return await o('InviteTokenCollection').collection.find({ teamId: input.source.team._id }).toArray();
  })(input.arguments, input);
