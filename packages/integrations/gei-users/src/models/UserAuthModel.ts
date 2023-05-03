import { ModelTypes } from '../zeus/index.js';

export type UserAuthModel = ModelTypes['UserAuth'] & {
  userId: string;
  salt?: string;
  passwordHash?: string;
  authorizationToken?: string;
  resetPasswordToken?: string;
  createdAt?: string;
};
