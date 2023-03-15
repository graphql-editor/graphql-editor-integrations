/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		mustBeTeamMember:{

		},
		team:{

		},
		showTeamInvitations:{
			status:"InvitationTeamStatus"
		},
		getGoogleOAuthLink:{
			setup:"GetOAuthInput"
		},
		getMicrosoftOAuthLink:{
			setup:"GetOAuthInput"
		},
		getGithubOAuthLink:{
			setup:"GetOAuthInput"
		},
		getAppleOAuthLink:{
			setup:"GetOAuthInput"
		},
		requestForForgotPassword:{

		}
	},
	MustBeTeamMemberError: "enum" as const,
	GetOAuthInput:{

	},
	Mutation:{
		register:{
			user:"RegisterInput"
		},
		verifyEmail:{
			verifyData:"VerifyEmailInput"
		},
		changePasswordWhenLogged:{
			changePasswordData:"ChangePasswordWhenLoggedInput"
		},
		changePasswordWithToken:{
			token:"ChangePasswordWithTokenInput"
		},
		generateInviteToken:{
			tokenOptions:"InviteTokenInput"
		},
		removeUserFromTeam:{
			data:"RemoveUserFromTeamInput"
		},
		sendInvitationToTeam:{
			invitation:"SendTeamInvitationInput"
		},
		joinToTeam:{

		},
		joinToTeamWithInvitationToken:{

		},
		createTeam:{

		},
		squashAccounts:{

		},
		integrateSocialAccount:{
			userData:"SimpleUserInput"
		},
		generateOAuthToken:{
			tokenData:"GenerateOAuthTokenInput"
		},
		editUser:{
			updatedUser:"UpdateUserInput"
		}
	},
	VerifyEmailError: "enum" as const,
	ChangePasswordWhenLoggedError: "enum" as const,
	ChangePasswordWithTokenError: "enum" as const,
	GenerateInviteTokenError: "enum" as const,
	RemoveUserFromTeamError: "enum" as const,
	SendInvitationToTeamError: "enum" as const,
	JoinToTeamError: "enum" as const,
	CreateTeamError: "enum" as const,
	SquashAccountsError: "enum" as const,
	JoinToTeamWithInvitationTokenError: "enum" as const,
	IntegrateSocialAccountError: "enum" as const,
	GenerateOAuthTokenError: "enum" as const,
	RemoveUserFromTeamInput:{

	},
	UpdateUserInput:{

	},
	GenerateOAuthTokenInput:{
		social:"SocialKind"
	},
	SimpleUserInput:{

	},
	LoginInput:{

	},
	SendTeamInvitationInput:{

	},
	VerifyEmailInput:{

	},
	InviteTokenInput:{

	},
	ChangePasswordWithTokenInput:{

	},
	ChangePasswordWhenLoggedInput:{

	},
	RegisterInput:{

	},
	InvitationTeamStatus: "enum" as const,
	SocialKind: "enum" as const,
	LoginQuery:{
		password:{
			user:"LoginInput"
		},
		provider:{
			params:"ProviderLoginInput"
		},
		refreshToken:{

		}
	},
	ProviderLoginInput:{

	},
	RegisterErrors: "enum" as const,
	LoginErrors: "enum" as const,
	ProviderErrors: "enum" as const
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		login:"LoginQuery",
		isUser:"User",
		mustBeUser:"User",
		mustBeTeamMember:"UserMember",
		team:"Team",
		showTeamInvitations:"InvitationTeamToken",
		getGoogleOAuthLink:"String",
		getMicrosoftOAuthLink:"String",
		getGithubOAuthLink:"String",
		getAppleOAuthLink:"String",
		requestForForgotPassword:"Boolean"
	},
	UserMember:{
		user:"UserAuthType",
		team:"TeamAuthType"
	},
	Mutation:{
		register:"RegisterResponse",
		verifyEmail:"VerifyEmailResponse",
		changePasswordWhenLogged:"ChangePasswordWhenLoggedResponse",
		changePasswordWithToken:"ChangePasswordWithTokenResponse",
		generateInviteToken:"GenerateInviteTokenResponse",
		removeUserFromTeam:"RemoveUserFromTeamResponse",
		sendInvitationToTeam:"SendInvitationToTeamResponse",
		joinToTeam:"JoinToTeamResponse",
		joinToTeamWithInvitationToken:"JoinToTeamWithInvitationTokenResponse",
		createTeam:"CreateTeamResponse",
		squashAccounts:"SquashAccountsResponse",
		integrateSocialAccount:"IntegrateSocialAccountResponse",
		generateOAuthToken:"GenerateOAuthTokenResponse",
		editUser:"Boolean"
	},
	VerifyEmailResponse:{
		result:"Boolean",
		hasError:"VerifyEmailError"
	},
	ChangePasswordWhenLoggedResponse:{
		result:"Boolean",
		hasError:"ChangePasswordWhenLoggedError"
	},
	ChangePasswordWithTokenResponse:{
		result:"Boolean",
		hasError:"ChangePasswordWithTokenError"
	},
	GenerateInviteTokenResponse:{
		result:"String",
		hasError:"GenerateInviteTokenError"
	},
	RemoveUserFromTeamResponse:{
		result:"Boolean",
		hasError:"GenerateInviteTokenError"
	},
	SendInvitationToTeamResponse:{
		result:"Boolean",
		hasError:"SendInvitationToTeamError"
	},
	JoinToTeamResponse:{
		result:"Boolean",
		hasError:"JoinToTeamError"
	},
	CreateTeamResponse:{
		result:"String",
		hasError:"CreateTeamError"
	},
	SquashAccountsResponse:{
		result:"Boolean",
		hasError:"SquashAccountsError"
	},
	JoinToTeamWithInvitationTokenResponse:{
		result:"Boolean",
		hasError:"JoinToTeamWithInvitationTokenError"
	},
	IntegrateSocialAccountResponse:{
		result:"Boolean",
		hasError:"IntegrateSocialAccountError"
	},
	GenerateOAuthTokenResponse:{
		result:"String",
		hasError:"GenerateOAuthTokenError"
	},
	InvitationTeamToken:{
		teamId:"String",
		recipient:"String",
		status:"InvitationTeamStatus",
		_id:"String",
		teamName:"String"
	},
	InviteToken:{
		token:"String",
		expires:"String",
		domain:"String",
		owner:"String",
		teamId:"String",
		_id:"String"
	},
	Team:{
		_id:"String",
		name:"String",
		owner:"String",
		members:"TeamMember"
	},
	TeamAuthType:{
		_id:"String",
		name:"String",
		owner:"String",
		members:"String"
	},
	User:{
		_id:"String",
		username:"String",
		teams:"Team",
		emailConfirmed:"Boolean"
	},
	UserAuthType:{
		_id:"String",
		username:"String",
		teams:"String",
		emailConfirmed:"Boolean"
	},
	Social:{
		_id:"String",
		socialId:"String",
		userId:"String"
	},
	UserAuth:{
		_id:"String",
		username:"String",
		password:"String"
	},
	TeamMember:{
		_id:"String",
		username:"String"
	},
	Node:{
		"...on InvitationTeamToken": "InvitationTeamToken",
		"...on InviteToken": "InviteToken",
		"...on Team": "Team",
		"...on TeamAuthType": "TeamAuthType",
		"...on User": "User",
		"...on Social": "Social",
		"...on UserAuth": "UserAuth",
		"...on TeamMember": "TeamMember",
		_id:"String"
	},
	LoginQuery:{
		password:"LoginResponse",
		provider:"ProviderLoginQuery",
		refreshToken:"String"
	},
	ProviderLoginQuery:{
		apple:"ProviderResponse",
		google:"ProviderResponse",
		github:"ProviderResponse",
		microsoft:"ProviderResponse"
	},
	RegisterResponse:{
		registered:"Boolean",
		hasError:"RegisterErrors"
	},
	LoginResponse:{
		login:"String",
		accessToken:"String",
		refreshToken:"String",
		hasError:"LoginErrors"
	},
	ProviderResponse:{
		jwt:"String",
		accessToken:"String",
		refreshToken:"String",
		providerAccessToken:"String",
		register:"Boolean",
		hasError:"ProviderErrors"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}