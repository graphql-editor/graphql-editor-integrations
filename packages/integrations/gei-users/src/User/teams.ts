import { FieldResolveInput } from 'stucco-js';
import { orm } from '../db/orm.js';
import { UserModel } from '../models/UserModel.js';
import { resolverFor } from '../zeus/index.js';

export const teams = async (input: FieldResolveInput) =>
  resolverFor('User', 'teams', async (args, src: UserModel) => {
    const teamModel = (await orm())('TeamCollection');
    const myTeams = await teamModel.collection
      .find({
        members: {
          $in: [src._id],
        },
      })
      .toArray();
    const myTeamsWithMembers = await teamModel.composeRelated(myTeams, 'members', 'UserCollection', '_id');
    return myTeamsWithMembers;
  })(input.arguments, input.source);
export default teams;
