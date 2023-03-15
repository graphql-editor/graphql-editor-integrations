import { FieldResolveInput } from 'stucco-js';
import pkg from 'jsonwebtoken';
import crypto from 'crypto';
import { TeamCollection, UserCollection } from './db/collections.js';
import { MustBeTeamMemberError, ResolverInputTypes } from './zeus/index.js';
import { UserModel } from './models/UserModel.js';
import { orm } from './db/orm.js';
import { UserMemberModel } from './models/UserMemberModel.js';
const { verify } = pkg;

export const decodeJWTToken = (token: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set');
  }
  const verifiedToken = verify(token, process.env.JWT_SECRET);
  if (typeof verifiedToken !== 'object') {
    throw new Error('Token is not an object');
  }
  return verifiedToken as Record<string, unknown>;
};
export const decodeRefreshToken = (token: string) => {
  const verifiedToken = decodeJWTToken(token);
  if (!verifiedToken.tokenId || !verifiedToken.sub) {
    throw new Error('Invalid token');
  }
  return verifiedToken as { tokenId: string; sub: string };
};
export const decodeToken = (token: string) => {
  const verifiedToken = decodeJWTToken(token);
  if (!verifiedToken.userId) {
    throw new Error('Invalid token');
  }
  return verifiedToken as { userId: string };
};

export const getUser = async (token: string): Promise<UserModel | undefined> => {
  const o = await orm();
  const col = o(UserCollection).collection;
  const { userId } = decodeToken(token);
  const user = await col.findOne({
    _id: userId,
  });
  if (!user) {
    return;
  }
  return user;
};
export const getUserFromHandlerInput = async (input: FieldResolveInput): Promise<UserModel | undefined> => {
  if (!input.protocol?.headers) {
    return;
  }
  const { Authorization }: { Authorization?: string[] } = input.protocol.headers;
  if (!Authorization) {
    return;
  }
  const findUser = await getUser(Authorization[0]);
  if (!findUser) {
    return;
  }
  return findUser;
};

export const getUserFromHandlerInputOrThrow = async (input: FieldResolveInput): Promise<UserModel> => {
  const user = await getUserFromHandlerInput(input);
  if (!user) {
    throw new Error('You are not logged in');
  }
  return user;
};

export const getUserMemberFromHandlerInputOrThrow = async (input: FieldResolveInput, teamId: string): Promise<UserMemberModel> => {
  const user = await getUserFromHandlerInputOrThrow(input);
  if (!user) {
    throw new Error('You are not logged in');
  }
  console.log(user)
  if (!user.teams.includes(teamId)) {
    throw new Error(MustBeTeamMemberError.USER_IS_NOT_A_TEAM_MEMBER)
  }
  const o = await orm();
  const team = await o(TeamCollection).collection.findOne({ _id: teamId });
  if (!team) throw new Error(MustBeTeamMemberError.TEAM_DOES_NOT_EXIST)
  return {user, team};
};

const isUserSource = (u: unknown): u is UserModel => isNotNullObject(u) && typeof u._id === 'string';

type Args<T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]> = Required<
  ResolverInputTypes[T]
>[Z] extends [infer Input, unknown]
  ? Input
  : never;
type UserArgs<T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]> = Args<T, Z> & {
  user: UserModel;
};

export const isNotNullObject = (v: unknown): v is Record<string | number | symbol, unknown> =>
  typeof v === 'object' && v !== null;

export const resolverForUser =
  <T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T], X = unknown>(
    _1: T,
    _2: Z,
    fn: (args: UserArgs<T, Z>, input: FieldResolveInput) => X,
  ) =>
  async (args: unknown, input: FieldResolveInput) => {
    if (!input.protocol?.headers?.Authorization) throw new Error('token does not exists in headers');
    const { protocol: { headers = {} } = {} } = input || {};
    const user = await getUser(headers.Authorization[0]);
    if (!isUserSource(user)) throw new Error('invalid user');
    const o = isNotNullObject(args) ? args : {};
    return fn({ ...o, user } as UserArgs<T, Z>, input);
  };

export const comparePasswords = ({ password, hash, salt }: { password: string; hash: string; salt: string }) => {
  return hash === passwordSha512(password, salt).passwordHash;
};

export const passwordSha512 = (password: string, salt: string) => {
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  const passwordHash = hash.digest('hex');
  return {
    salt,
    passwordHash,
  };
};
