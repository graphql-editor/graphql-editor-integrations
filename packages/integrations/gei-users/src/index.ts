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
import { handler as showInviteTokens } from './Query/showInviteTokens.js';
import { handler as deleteInvitation } from './Mutation/deleteInvitation.js';
import { handler as requestForForgotPassword } from './Query/requestForForgotPassword.js';
import { handler as createTeam } from './Mutation/createTeam.js';
import { handler as verifyEmail } from './Mutation/verifyEmail.js';
import { handler as changePasswordWhenLogged } from './Mutation/changePasswordWhenLogged.js';
import { handler as editUser} from './Mutation/editUser.js'

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
    mustBeTeamMember: {
      name: 'MustBeTeamMember',
      description:
        'Provide token via headers to check if user is member this team. Returns User object and Team object. If user is not team member in throws an error',
      handler: mustBeTeamMember,
    },
    team: {
      name: 'team',
      description: 'Get your teamId',
      handler: team,
    },
    getGoogleOAuthLink: {
      name: 'GetGoogleOAuthLink',
      description: 'Get Google OAuth link for login user with his Google account',
      handler: getGoogleOAuthLink,
    },
    getGithubOAuthLink: {
      name: 'GetGithubOAuthLink',
      description: 'Get Github OAuth link for login user with his Github account',
      handler: getGithubOAuthLink,
    },
    getAppleOAuthLink: {
      name: 'GetAppleOAuthLink',
      description: 'Get Apple OAuth link for login user with his Apple account',
      handler: getAppleOAuthLink,
    },
    getMicrosoftOAuthLink: {
      name: 'GetMicrosoftOAuthLink',
      description: 'Get Microsoft OAuth link for login user with his Microsoft account',
      handler: getMicrosoftOAuthLink,
    },
    showTeamInvitations: {
      name: 'ShowTeamInvitations',
      description: 'Show all private team invitations that were sent for you or from this team to emails to users',
      handler: showTeamInvitations,
    },
    showInviteTokens: {
      name: 'ShowInviteTokens',
      description: 'Show all invite tokens, that were generated by this team',
      handler: showInviteTokens,
    },
    requestForForgotPassword: {
      name: 'RequestForForgotPassword',
      description: 'Provide your email, send this request and get link for create new password',
      handler: requestForForgotPassword,
    },
  },
  Mutation: {
    createTeam: {
      name: 'CreateTeam',
      description: 'Provide team name and become the owner of the new team',
      handler: createTeam,
    },
    editUser: {
      name: 'EditUser',
      description: 'Edit user data',
      handler: editUser,
    },
    verifyEmail: {
      name: 'VerifyEmail',
      description:
        'Provide token which you will receive by mail after registration to confirm verify your email address',
      handler: verifyEmail,
    },
    changePasswordWhenLogged: {
      name: 'ChangePasswordWhenLogged',
      description: 'Provide email, old and new password to change password',
      handler: changePasswordWhenLogged,
    },
    changePasswordWithToken: {
      name: 'changePasswordWithToken',
      description:
        'Provide  email, new password and token which you will receive by mail after sending a request for forgot password',
      handler: changePasswordWithToken,
    },
    generateInviteToken: {
      name: 'GenerateInviteToken',
      description: 'Provide teamId, and generate team invite token for send to anyone',
      handler: generateInviteToken,
    },
    sendInvitationToTeam: {
      name: 'sendInvitationToTeam',
      description: 'Provide teamId and email of the user to send to him private team invitation',
      handler: sendInvitationToTeam,
    },
    deleteInvitation: {
      name: 'DeleteInvitationOrInviteToken',
      description: 'Provide invitationId or inviteTokenId to delete it',
      handler: deleteInvitation,
    },
    joinToTeam: {
      name: 'JoinToTeam',
      description: 'If you received private invitation to the team, then provide here teamId and be joined',
      handler: joinToTeam,
    },
    removeUserFromTeam: {
      name: 'RemoveUserFromTeam',
      description: 'Provide teamId and userId to remove this user from this team',
      handler: removeUserFromTeam,
    },
    squashAccounts: {
      name: 'SquashAccounts',
      description:
        'This mutation basically serves accounts registered by password before login by providers. This case have create two accounts with one email. You can merge them into one - simply run it without arguments. Also you can merge accounts registered with different emails, if provide in arguments password. Now the password is _id of the user account you want be merge with. New account will have the email of the profile from which run this mutation. But if one of the profiles has hide email, then it anyway will be replaced',
      handler: squashAccounts,
    },
    integrateSocialAccount: {
      name: 'integrateSocialAccount',
      description: 'Endpoint using to merge user social account which is pointed with parameters',
      handler: integrateSocialAccount,
    },
    joinToTeamWithInvitationToken: {
      name: 'JoinToTeamWithInvitationToken',
      description: 'This mutation for registered users to join to team by invite token. Provide token and be joined',
      handler: joinToTeamWithInvitationToken,
    },
    generateOAuthToken: {
      name: 'GenerateOAuthToken',
      description:
        'This endpoint send to social api (google/github/apple) request for get information about user which have code as his identify',
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
      name: 'ShowMyTeams',
      description: 'Show all your teams with members',
      handler: teams,
    },
  },
  LoginQuery: {
    password: {
      name: 'Password',
      description: 'Login with email and password',
      handler: password,
    },
    provider: {
      name: 'Provider',
      description: 'Login with provider. Use with resolvers google/github/apple/microsoft',
      handler: provider,
    },
    refreshToken: {
      name: 'RefreshToken',
      description: 'Get new accessToken by refreshToken',
      handler: refreshToken,
    },
  },
  ProviderLoginQuery: {
    apple: {
      name: 'Apple',
      description:
        'Login with apple. Provide here the code that you will get by the link from resolver getAppleOAuthLink',
      handler: apple,
    },
    google: {
      name: 'Google',
      description:
        'Login with google. Provide here the code that you will get by the link from resolver getGoogleOAuthLink',
      handler: google,
    },
    github: {
      name: 'Github',
      description:
        'Login with github. Provide here the code that you will get by the link from resolver getGithubOAuthLink',
      handler: github,
    },
    microsoft: {
      name: 'Microsoft',
      description:
        'Login with microsoft. Provide here the code that you will get by the link from resolver getMicrosoftOAuthLink',
      handler: microsoft,
    },
  },
});

export default integration;
