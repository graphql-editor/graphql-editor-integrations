import { FieldResolveInput } from 'stucco-js';
import { orm } from '../db/orm.js';
import { EditUserError, resolverFor } from '../zeus/index.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'editUser', async ({ updatedUser }) => {
    const o = await orm();
    const { userId, username, fullName } = updatedUser;
    const userCollection = o('UserCollection').collection;

    const user = await userCollection.findOne({ _id: userId });
    if (!user) {
      return { hasError: EditUserError.USER_DOES_NOT_EXIST };
    }

    if (username !== undefined && username !== null) {
      const existingUser = await userCollection.findOne({ username, userId: { $ne: userId } });
      if (existingUser) {
        return { hasError: EditUserError.USERNAME_ALREADY_TAKEN };
      }
    }
    const update: any = {};
    if (username !== undefined && username !== null) {
      update.username = username;
    }
    if (fullName !== undefined && fullName !== null) {
      update.fullName = fullName;
    }

    const res = await userCollection.updateOne({ _id: userId }, { $set: update });
    if (res.modifiedCount === 0) {
      return { hasError: EditUserError.FAILED_MONGO_UPDATE };
    }
  })(input.arguments);
