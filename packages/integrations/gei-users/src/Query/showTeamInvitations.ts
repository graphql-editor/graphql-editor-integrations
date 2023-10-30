import { UserModel } from './../models/UserModel';
import { UserMemberModel } from './../models/UserMemberModel.js';
import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { MongoOrb } from '../db/orm.js';
import { TeamModel } from '../models/TeamModel';

export const showTeamInvitations = async (input: FieldResolveInput) =>
  resolverForUser('Query', 'showTeamInvitations', async ({ status, sentFromMyTeam }, input) => {
    const possibleSource = input.source as UserMemberModel | UserModel | TeamModel;
    if ('user' in possibleSource && 'team' in possibleSource) {
      // User membea
      if (sentFromMyTeam) {
        return MongoOrb('TeamInvitationsCollection')
          .collection.find({
            teamId: possibleSource.team._id,
            status: status || undefined,
          })
          .toArray();
      }
      return MongoOrb('TeamInvitationsCollection')
        .collection.find({
          recipient: possibleSource.user.username,
          status: status || undefined,
        })
        .toArray();
    }
    if ('username' in possibleSource && possibleSource.username) {
      return MongoOrb('TeamInvitationsCollection')
        .collection.find({
          recipient: possibleSource.username,
          status: status || undefined,
        })
        .toArray();
    }
    if ('name' in possibleSource) {
      return MongoOrb('TeamInvitationsCollection')
        .collection.find({
          teamId: possibleSource._id,
          status: status || undefined,
        })
        .toArray();
    }
    return [];
  })(input.arguments, input);
export default showTeamInvitations;
