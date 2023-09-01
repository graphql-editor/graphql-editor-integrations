import { iGraphQL } from 'i-graphql';
import { ObjectId } from 'mongodb';

export const orm = async () => {
  return iGraphQL<Record<string, any>, { _id: () => string; createdAt: () => string }>({
    _id: () => new ObjectId().toHexString(),
    createdAt: () => new Date().toISOString(),
  });
};

export async function DB() {
  return orm();
}
