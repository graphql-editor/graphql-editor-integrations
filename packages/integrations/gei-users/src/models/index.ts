import { QueryModel } from './QueryModel'
import { UserMemberModel } from './UserMemberModel'
import { MutationModel } from './MutationModel'
import { VerifyEmailResponseModel } from './VerifyEmailResponseModel'
import { ChangePasswordWhenLoggedResponseModel } from './ChangePasswordWhenLoggedResponseModel'
import { ChangePasswordWithTokenResponseModel } from './ChangePasswordWithTokenResponseModel'
import { GenerateInviteTokenResponseModel } from './GenerateInviteTokenResponseModel'
import { RemoveUserFromTeamResponseModel } from './RemoveUserFromTeamResponseModel'
import { SendInvitationToTeamResponseModel } from './SendInvitationToTeamResponseModel'
import { JoinToTeamResponseModel } from './JoinToTeamResponseModel'
import { CreateTeamResponseModel } from './CreateTeamResponseModel'
import { SquashAccountsResponseModel } from './SquashAccountsResponseModel'
import { JoinToTeamWithInvitationTokenResponseModel } from './JoinToTeamWithInvitationTokenResponseModel'
import { IntegrateSocialAccountResponseModel } from './IntegrateSocialAccountResponseModel'
import { GenerateOAuthTokenResponseModel } from './GenerateOAuthTokenResponseModel'
import { InvitationTeamTokenModel } from './InvitationTeamTokenModel'
import { InviteTokenModel } from './InviteTokenModel'
import { TeamModel } from './TeamModel'
import { TeamAuthTypeModel } from './TeamAuthTypeModel'
import { UserModel } from './UserModel'
import { UserAuthTypeModel } from './UserAuthTypeModel'
import { SocialModel } from './SocialModel'
import { UserAuthModel } from './UserAuthModel'
import { TeamMemberModel } from './TeamMemberModel'
import { LoginQueryModel } from './LoginQueryModel'
import { ProviderLoginQueryModel } from './ProviderLoginQueryModel'
import { RegisterResponseModel } from './RegisterResponseModel'
import { LoginResponseModel } from './LoginResponseModel'
import { ProviderResponseModel } from './ProviderResponseModel'


export type Models = {
	QueryModel: QueryModel;
	UserMemberModel: UserMemberModel;
	MutationModel: MutationModel;
	VerifyEmailResponseModel: VerifyEmailResponseModel;
	ChangePasswordWhenLoggedResponseModel: ChangePasswordWhenLoggedResponseModel;
	ChangePasswordWithTokenResponseModel: ChangePasswordWithTokenResponseModel;
	GenerateInviteTokenResponseModel: GenerateInviteTokenResponseModel;
	RemoveUserFromTeamResponseModel: RemoveUserFromTeamResponseModel;
	SendInvitationToTeamResponseModel: SendInvitationToTeamResponseModel;
	JoinToTeamResponseModel: JoinToTeamResponseModel;
	CreateTeamResponseModel: CreateTeamResponseModel;
	SquashAccountsResponseModel: SquashAccountsResponseModel;
	JoinToTeamWithInvitationTokenResponseModel: JoinToTeamWithInvitationTokenResponseModel;
	IntegrateSocialAccountResponseModel: IntegrateSocialAccountResponseModel;
	GenerateOAuthTokenResponseModel: GenerateOAuthTokenResponseModel;
	InvitationTeamTokenModel: InvitationTeamTokenModel;
	InviteTokenModel: InviteTokenModel;
	TeamModel: TeamModel;
	TeamAuthTypeModel: TeamAuthTypeModel;
	UserModel: UserModel;
	UserAuthTypeModel: UserAuthTypeModel;
	SocialModel: SocialModel;
	UserAuthModel: UserAuthModel;
	TeamMemberModel: TeamMemberModel;
	LoginQueryModel: LoginQueryModel;
	ProviderLoginQueryModel: ProviderLoginQueryModel;
	RegisterResponseModel: RegisterResponseModel;
	LoginResponseModel: LoginResponseModel;
	ProviderResponseModel: ProviderResponseModel;
};