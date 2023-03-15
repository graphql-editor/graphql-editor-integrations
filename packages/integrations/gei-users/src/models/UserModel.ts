import { MongoModel } from 'i-graphql';
import { ModelTypes } from '../zeus/index.js';

export type UserModel = MongoModel<ModelTypes['User']>;
