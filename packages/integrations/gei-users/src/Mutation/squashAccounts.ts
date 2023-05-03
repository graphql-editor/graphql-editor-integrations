import { FieldResolveInput } from 'stucco-js';
import { resolverForUser } from '../UserMiddleware.js';
import { SocialCollection, TeamCollection, UserAuthorizationCollection, UserCollection } from '../db/collections.js';
import { WithId } from 'mongodb';
import { orm } from '../db/orm.js';
import { UserModel } from '../models/UserModel.js';
import { SquashAccountsError } from '../zeus/index.js';

export const replaceAllElementsAsElementWithValuesOnFirstIndex = async (
  o: Awaited<ReturnType<typeof orm>>,
  elements: WithId<UserModel>[],
  collection: typeof SocialCollection | typeof UserAuthorizationCollection,
) =>
  Promise.all(
    elements
      .slice(1)
      .map(async (user) =>
        o(collection).collection.updateOne({ userId: user._id }, { $set: { userId: elements[0]._id } }),
      ),
  );

export const changeOwnerOfTeams = async (o: Awaited<ReturnType<typeof orm>>, elements: WithId<UserModel>[]) =>
  Promise.all(
    elements
      .slice(1)
      .map(async (user) =>
        o(TeamCollection).collection.updateOne({ owner: user._id }, { $set: { owner: elements[0]._id } }),
      ),
  );

export const changeMemberOfTeams = async (o: Awaited<ReturnType<typeof orm>>, elements: WithId<UserModel>[]) =>
  Promise.all(
    elements.slice(1).map(async (user) => {
      o(TeamCollection).collection.updateMany({ members: user._id }, { $set: { 'members.$': elements[0]._id } });
      o(TeamCollection).collection.aggregate([
        {
          $unwind: '$members',
        },
        {
          $group: {
            _id: '$_id',
            members: {
              $addToSet: '$members',
            },
          },
        },
        {
          $project: {
            members: '$members',
          },
        },
      ]);
    }),
  );

export const handler = (input: FieldResolveInput) =>
  resolverForUser('Mutation', 'squashAccounts', async ({ user, password }) => {
    const o = await orm();
    const username =
      password && !user.username.includes('@')
        ? (await o(UserCollection).collection.findOne({ _id: password }))?.username
        : user.username;
    const replace_id = password && !user.username.includes('@') ? user._id : password;
    if (!username) return { hasError: SquashAccountsError.INCORRECT_PASSWORD };
    await o(UserCollection).collection.updateOne({ _id: replace_id || undefined }, { $set: { username: username } });
    const usersToSquash = await o(UserCollection).collection.find({ username: username }).toArray();
    if (usersToSquash.length === 1) return { hasError: SquashAccountsError.YOU_HAVE_ONLY_ONE_ACCOUNT };
    if (usersToSquash.find((user) => user.emailConfirmed === false))
      return { hasError: SquashAccountsError.YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL };
    await Promise.all(
      usersToSquash.slice(1).map(async (user) => o(UserCollection).collection.deleteOne({ _id: user._id })),
    );
    await Promise.all([
      replaceAllElementsAsElementWithValuesOnFirstIndex(o, usersToSquash, SocialCollection),
      replaceAllElementsAsElementWithValuesOnFirstIndex(o, usersToSquash, UserAuthorizationCollection),
      changeOwnerOfTeams(o, usersToSquash),
      changeMemberOfTeams(o, usersToSquash),
    ]);
    return { result: true };
  })(input.arguments, input);
