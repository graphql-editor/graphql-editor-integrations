import { MongoModel } from 'i-graphql';

export type RefreshTokenModel = MongoModel<{
  _id: string;
  userId: string;
}>;
