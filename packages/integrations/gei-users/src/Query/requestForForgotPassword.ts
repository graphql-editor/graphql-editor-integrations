import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { UserAuthorizationCollection } from '../db/collections.js';
import { MailgunWrapper, formatForgotPassword } from '../mailgun.js';
import crypto from 'crypto';
import { orm } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Query', 'requestForForgotPassword', async ({ username }) => {
    const o = await orm();
    if (await o(UserAuthorizationCollection).collection.findOne({ username })) {
      const resetPasswordToken = crypto.pseudoRandomBytes(8).toString('hex');
      await o(UserAuthorizationCollection).collection.updateOne({ username }, { $set: { resetPasswordToken } });
      MailgunWrapper()?.send(formatForgotPassword(username, resetPasswordToken));
      return true;
    }
    return false;
  })(input.arguments);
