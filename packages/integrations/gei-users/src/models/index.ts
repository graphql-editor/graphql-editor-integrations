import { QueryModel } from './QueryModel.js'
import { UserMemberModel } from './UserMemberModel.js'
import { MutationModel } from './MutationModel.js'
import { EditUserResponseModel } from './EditUserResponseModel.js'
import { VerifyEmailResponseModel } from './VerifyEmailResponseModel.js'
import { ChangePasswordWhenLoggedResponseModel } from './ChangePasswordWhenLoggedResponseModel.js'
import { ChangePasswordWithTokenResponseModel } from './ChangePasswordWithTokenResponseModel.js'
import { GenerateInviteTokenResponseModel } from './GenerateInviteTokenResponseModel.js'
import { RemoveUserFromTeamResponseModel } from './RemoveUserFromTeamResponseModel.js'
import { SendInvitationToTeamResponseModel } from './SendInvitationToTeamResponseModel.js'
import { JoinToTeamResponseModel } from './JoinToTeamResponseModel.js'
import { CreateTeamResponseModel } from './CreateTeamResponseModel.js'
import { SquashAccountsResponseModel } from './SquashAccountsResponseModel.js'
import { JoinToTeamWithInvitationTokenResponseModel } from './JoinToTeamWithInvitationTokenResponseModel.js'
import { IntegrateSocialAccountResponseModel } from './IntegrateSocialAccountResponseModel.js'
import { GenerateOAuthTokenResponseModel } from './GenerateOAuthTokenResponseModel.js'
import { InvitationTeamTokenModel } from './InvitationTeamTokenModel.js'
import { InviteTokenModel } from './InviteTokenModel.js'
import { TeamModel } from './TeamModel.js'
import { TeamAuthTypeModel } from './TeamAuthTypeModel.js'
import { UserModel } from './UserModel.js'
import { UserAuthTypeModel } from './UserAuthTypeModel.js'
import { SocialModel } from './SocialModel.js'
import { UserAuthModel } from './UserAuthModel.js'
import { TeamMemberModel } from './TeamMemberModel.js'
import { LoginQueryModel } from './LoginQueryModel.js'
import { ProviderLoginQueryModel } from './ProviderLoginQueryModel.js'
import { RegisterResponseModel } from './RegisterResponseModel.js'
import { LoginResponseModel } from './LoginResponseModel.js'
import { ProviderResponseModel } from './ProviderResponseModel.js'


export type Models = {
	QueryModel: QueryModel;
	UserMemberModel: UserMemberModel;
	MutationModel: MutationModel;
	EditUserResponseModel: EditUserResponseModel;
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