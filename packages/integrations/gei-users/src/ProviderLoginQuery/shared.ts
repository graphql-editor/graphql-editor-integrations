import pkg from 'jsonwebtoken';
const { sign } = pkg;
import fetch from 'node-fetch';
import { RefreshTokenCollection, SocialCollection, UserCollection } from '../db/collections.js';
import { orm } from '../db/orm.js';
import { getEnv } from '../envGuard.js';
import { ModelTypes, SocialKind } from '../zeus/index.js';

export type ProviderLoginQuerySrc = ModelTypes['ProviderLoginInput'];

export const createSocialAccount = async (o: Awaited<ReturnType<typeof orm>>, { ...rest }) =>
  await o(SocialCollection).createWithAutoFields('_id')({
    socialId: `${rest.social}|${rest.id}`,
    userId: rest.userId,
  });

export const addUserAndConnectSocial = async ({
  id,
  o,
  social,
  username,
}: {
  o: Awaited<ReturnType<typeof orm>>;
  id: string;
  username: string | null;
  social: SocialKind;
}) => {
  if (!username) throw new Error('username and email both cannot be null');

  const foundSocial = await o(SocialCollection).collection.findOne({ socialId: `${social}|${id}` });
  if (foundSocial) {
    const refreshTokenId = (
      await o(RefreshTokenCollection).createWithAutoFields('_id')({
        userId: foundSocial.userId,
      })
    ).insertedId;
    return { id: foundSocial.userId, refreshTokenId: refreshTokenId, register: false };
  }

  const foundUser = await o(UserCollection).collection.findOne({ username });
  if (!foundUser) {
    const createdUser = await o(UserCollection).createWithAutoFields(
      '_id',
      'createdAt',
    )({
      username,
      emailConfirmed: true,
      teams: [],
    });
    await o(SocialCollection).createWithAutoFields(
      '_id',
      'createdAt',
    )({
      socialId: `${social}|${id}`,
      userId: createdUser.insertedId,
    });
    const createdRefreshToken = await o(RefreshTokenCollection).createWithAutoFields('_id')({
      userId: createdUser.insertedId,
    });
    return { id: createdUser.insertedId, refreshTokenId: createdRefreshToken.insertedId, register: true };
  }
  const refreshTokenId = (
    await o(RefreshTokenCollection).createWithAutoFields('_id')({
      userId: foundUser._id,
    })
  ).insertedId;

  if (!foundSocial) {
    await o(SocialCollection).createWithAutoFields(
      '_id',
      'createdAt',
    )({
      socialId: `${social}|${id}`,
      userId: foundUser._id,
    });
    return { id: foundUser._id, refreshTokenId: refreshTokenId, register: false };
  }
  throw new Error('Undefined Error. Cannot create social connection to user account');
};

export const getUserInfo = async (url: string, token: string) =>
  fetch(`${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => response.json() as Promise<Record<string, any>>);

export const getGithubInfo = async (url: string, token: string) =>
  fetch(`${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
    },
  }).then((response) => response.json() as Promise<Record<string, string>>);

export const getMicrosoftUserInfo = async (url: string, token: string) =>
  fetch(`${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json() as Promise<Record<string, string>>);

export const getJwtAndRefreshToken = (
  id: string,
  refreshTokenId: string,
): { jwtToken: string; refreshToken: string } => {
  const JWT_SECRET = getEnv('JWT_SECRET');
  const JWT_TOKEN_EXPIRATION_IN_SECONDS = process.env['JWT_TOKEN_EXPIRATION_IN_SECONDS'];
  const expiresIn = JWT_TOKEN_EXPIRATION_IN_SECONDS ? parseInt(JWT_TOKEN_EXPIRATION_IN_SECONDS) : 60 * 60 * 24;

  return {
    jwtToken: sign({ userId: id }, JWT_SECRET, {
      expiresIn,
    }),
    refreshToken: sign({ tokenId: refreshTokenId, sub: id }, JWT_SECRET),
  };
};
