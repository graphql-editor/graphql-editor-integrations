import { NewIntegration } from 'graphql-editor-cli';
import { handler as login } from './Query/login.js';
import { handler as isUser } from './Query/isUser.js';
import { handler as mustBeUser } from './Query/mustBeUser.js';
import { handler as team } from './Query/team.js';
import { handler as getGoogleOAuthLink } from './Query/getGoogleOAuthLink.js';
import { handler as getGithubOAuthLink } from './Query/getGithubOAuthLink.js';
import { handler as getAppleOAuthLink } from './Query/getAppleOAuthLink.js';
import { handler as register } from './Mutation/register.js';
import { handler as teams } from './User/teams.js';
import { handler as mustBeTeamMember } from './Query/mustBeTeamMember.js';
import { handler as getMicrosoftOAuthLink } from './Query/getMicrosoftOAuthLink.js';
import { handler as showTeamInvitations } from './Query/showTeamInvitations.js';
import { handler as requestForForgotPassword } from './Query/requestForForgotPassword.js';
import { handler as createTeam } from './Mutation/createTeam.js';
import { handler as verifyEmail } from './Mutation/verifyEmail.js';
import { handler as changePasswordWhenLogged } from './Mutation/changePasswordWhenLogged.js';

import { handler as integrateSocialAccount } from './Mutation/integrateSocialAccount.js';
import { handler as changePasswordWithToken } from './Mutation/changePasswordWithToken.js';
import { handler as generateInviteToken } from './Mutation/generateInviteToken.js';
import { handler as sendInvitationToTeam } from './Mutation/sendInvitationToTeam.js';
import { handler as joinToTeam } from './Mutation/joinToTeam.js';
import { handler as removeUserFromTeam } from './Mutation/removeUserFromTeam.js';
import { handler as squashAccounts } from './Mutation/squashAccounts.js';
import { handler as joinToTeamWithInvitationToken } from './Mutation/joinToTeamWithInvitationToken.js';
import { handler as generateOAuthToken } from './Mutation/generateOAuthToken.js';
import { handler as password } from './LoginQuery/password.js';
import { handler as provider } from './LoginQuery/provider.js';
import { handler as apple } from './ProviderLoginQuery/apple.js';
import { handler as google } from './ProviderLoginQuery/google.js';
import { handler as github } from './ProviderLoginQuery/github.js';
import { handler as microsoft } from './ProviderLoginQuery/microsoft.js';
import { handler as refreshToken } from './LoginQuery/refreshToken.js';

export const integration = NewIntegration({
  Query: {
    login: {
      name: 'Login',
      description: 'Login from password or social account',
      handler: login,
    },
    isUser: {
      name: 'Is logged in',
      description: 'Provide token via headers to check if user is logged in. Returns User object',
      handler: isUser,
    },
    mustBeUser: {
      name: 'Must be logged in',
      description:
        'Provide token via headers to check if user is logged in. Returns User object. If user is not logged in throws an error',
      handler: mustBeUser,
    },
    team: {
      name: 'team',
      description: 'Get your teamId',
      handler: team,
    },
    getGoogleOAuthLink: {
      name: 'GetGoogleOAuthLink',
      description: 'GetGoogleOAuthLink',
      handler: getGoogleOAuthLink,
    },
    getGithubOAuthLink: {
      name: 'GetGithubOAuthLink',
      description: 'getGithubOAuthLink',
      handler: getGithubOAuthLink,
    },
    getAppleOAuthLink: {
      name: 'GetAppleOAuthLink',
      description: 'getAppleOAuthLink',
      handler: getAppleOAuthLink,
    },
    showTeamInvitations: {
      name: 'ShowTeamInvitations',
      description: 'showTeamInvitations',
      handler: showTeamInvitations,
    },
    requestForForgotPassword: {
      name: 'RequestForForgotPassword',
      description: 'requestForForgotPassword',
      handler: requestForForgotPassword,
    },
    getMicrosoftOAuthLink: {
      name: 'GetMicrosoftOAuthLink',
      description: 'getMicrosoftOAuthLink',
      handler: getMicrosoftOAuthLink,
    },
    mustBeTeamMember: {
      name: 'MustBeTeamMember',
      description: 'mustBeTeamMember',
      handler: mustBeTeamMember,
    },
  },
  Mutation: {
    createTeam: {
      name: 'CreateTeam',
      description: 'createTeam',
      handler: createTeam,
    },
    verifyEmail: {
      name: 'VerifyEmail',
      description: 'verifyEmail',
      handler: verifyEmail,
    },
    changePasswordWhenLogged: {
      name: 'ChangePasswordWhenLogged',
      description: 'changePasswordWhenLogged',
      handler: changePasswordWhenLogged,
    },
    changePasswordWithToken: {
      name: 'changePasswordWithToken',
      description: 'changePasswordWithToken',
      handler: changePasswordWithToken,
    },
    generateInviteToken: {
      name: 'GenerateInviteToken',
      description: 'generateInviteToken',
      handler: generateInviteToken,
    },
    sendInvitationToTeam: {
      name: 'sendInvitationToTeam',
      description: 'sendInvitationToTeam',
      handler: sendInvitationToTeam,
    },
    joinToTeam: {
      name: 'JoinToTeam',
      description: 'joinToTeam',
      handler: joinToTeam,
    },
    removeUserFromTeam: {
      name: 'RemoveUserFromTeam',
      description: 'removeUserFromTeam',
      handler: removeUserFromTeam,
    },
    squashAccounts: {
      name: 'SquashAccounts',
      description: 'squashAccounts',
      handler: squashAccounts,
    },
    integrateSocialAccount: {
      name: 'integrateSocialAccount',
      description: 'integrateSocialAccount',
      handler: integrateSocialAccount,
    },
    joinToTeamWithInvitationToken: {
      name: 'JoinToTeamWithInvitationToken',
      description: 'joinToTeamWithInvitationToken',
      handler: joinToTeamWithInvitationToken,
    },
    generateOAuthToken: {
      name: 'GenerateOAuthToken',
      description: 'generateOAuthToken',
      handler: generateOAuthToken,
    },
    register: {
      name: 'Register',
      description: 'Username and password registration resolver',
      handler: register,
    },
  },
  User: {
    teams: {
      name: 'Teams',
      description: 'Show your teams with members',
      handler: teams,
    },
  },
  LoginQuery: {
    password: {
      name: 'Password',
      description: 'Login with password',
      handler: password,
    },
    provider: {
      name: 'Provider',
      description: 'Login with provider',
      handler: provider,
    },
    refreshToken: {
      name: 'RefreshToken',
      description: 'get new accessToken by refreshToken',
      handler: refreshToken,
    },
  },
  ProviderLoginQuery: {
    apple: {
      name: 'Apple',
      description: 'Login with apple',
      handler: apple,
    },
    google: {
      name: 'Google',
      description: 'Login with google',
      handler: google,
    },
    github: {
      name: 'Github',
      description: 'Login with github',
      handler: github,
    },
    microsoft: {
      name: 'Microsoft',
      description: 'Login with microsoft',
      handler: microsoft,
    },
  },
});

export default integration;
