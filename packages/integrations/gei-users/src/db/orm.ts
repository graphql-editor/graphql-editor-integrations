import { iGraphQL } from 'i-graphql';
import { ObjectId } from 'mongodb';
import { Models } from '../models/index.js';
import { RefreshTokenModel } from '../models/RefreshTokenModel.js';

export const orm = async () => {
  return iGraphQL<
    {
      UserCollection: Models['UserModel'];
      UserAuthorizationCollection: Models['UserAuthModel'];
      InviteTokenCollection: Models['InviteTokenModel'];
      SocialCollection: Models['SocialModel'];
      TeamInvitationsCollection: Models['InvitationTeamTokenModel'];
      TeamCollection: Models['TeamModel'];
      RefreshTokenCollection: RefreshTokenModel;
    },
    {
      _id: () => string;
    }
  >({
    _id: () => new ObjectId().toHexString(),
  });
};
