import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { getEnv } from './envGuard.js';

export const formatVerifyEmail = (to: string, authorizationToken: string) => ({
  to,
  sender: `${getEnv('MAILGUN_SENDER')}`,
  body: `You have registered your account. Follow this link to verify account: ${getEnv(
    'MAILGUN_REDIRECT_PATH',
  )}/verify?AccountToken=${authorizationToken}`,
  subject: `[${getEnv('MAILGUN_DOMAIN')}] Account Verify`,
});

export const formatForgotPassword = (to: string, token: string) => ({
  to,
  sender: `${getEnv('MAILGUN_SENDER')}`,
  body: `You have requested for reset password. Follow this link to verify account: ${getEnv(
    'MAILGUN_REDIRECT_PATH',
  )}/new-password?ForgotToken=${token}&Username=${to}`,
  subject: `[${getEnv('MAILGUN_DOMAIN')}] Forgot Password`,
});

export const formatInvitationToTeam = (to: string, teamId: string, teamName: string) => ({
  to,
  sender: `${getEnv('MAILGUN_SENDER')}`,
  body: `You got invitation to team ${teamName}. Follow this link to accept invitation: ${getEnv(
    'MAILGUN_REDIRECT_PATH',
  )}/to-team?ForgotToken=${teamId}&Username=${to}`,
  subject: `[${getEnv('MAILGUN_DOMAIN')}] Team invitation`,
});

const mailgun = new Mailgun(FormData);

export interface EMail {
  sender: string;
  to: string | string[];
  subject: string;
  body: string;
}

export type Client = ReturnType<typeof mailgun.client>;

export class MailgunWrapperClass {
  private mg: Client;
  constructor(apiKey: string = getEnv('MAILGUN_API_KEY'), private domain: string = getEnv('MAILGUN_DOMAIN')) {
    this.mg = mailgun.client({ username: 'api', key: apiKey, url: getEnv('MAILGUN_SERVER_DOMAIN') });
  }
  send(email: EMail) {
    const data: {
      from: string;
      to: string;
      subject: string;
      text: string;
    } = {
      from: email.sender,
      to: Array.isArray(email.to) ? email.to.join(', ') : email.to,
      subject: email.subject,
      text: email.body,
    };
    return this.mg.messages.create(this.domain, data);
  }
}

let HoldMailgunWrapper: MailgunWrapperClass | undefined;

export const MailgunWrapper = () => {
  if (HoldMailgunWrapper) return HoldMailgunWrapper;
  HoldMailgunWrapper = new MailgunWrapperClass();
  return HoldMailgunWrapper;
};
