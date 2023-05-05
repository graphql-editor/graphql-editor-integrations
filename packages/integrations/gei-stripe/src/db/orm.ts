import { iGraphQL } from 'i-graphql';
import { ObjectId } from 'mongodb';

export const orm = async () => {
  return iGraphQL<
    {},
    {
      _id: () => string;
      createdAt: () => string;
    }
  >({
    _id: () => new ObjectId().toHexString(),
    createdAt: () => new Date().toISOString(),
  });
};

export const MongoOrb = await orm();
