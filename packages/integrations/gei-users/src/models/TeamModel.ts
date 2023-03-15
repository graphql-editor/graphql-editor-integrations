import { MongoModel } from 'i-graphql';
import { ModelTypes } from '../zeus/index.js';

export type TeamModel = MongoModel< Omit<ModelTypes['Team'], 'owner'> & {
    owner: string | undefined | null;
}>;
