import { orm } from './../db/orm.js';

import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';

export const deleteInvitation = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'deleteInvitation', async ({ id }, input) => {
    const o = await orm();

    const res1 = await o('TeamInvitationsCollection').collection.deleteOne({ _id: id, teamId: input.source.team._id });
    const res =
      res1.deletedCount === 1
        ? res1
        : await o('InviteTokenCollection').collection.deleteOne({ _id: id, teamId: input.source.team._id });
    return res.deletedCount === 1;
  })(input.arguments, input);
export default deleteInvitation;
