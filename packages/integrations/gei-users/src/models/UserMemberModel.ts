import { ModelTypes } from '../zeus/index.js';
import { TeamModel } from './TeamModel.js';

export type UserMemberModel = Omit<ModelTypes['UserMember'], 'team'> & {
    team: TeamModel
};

