/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		userQuery:{

		}
	},
	UserQuery:{
		getChannelAuthorization:{
			input:"GetChannelAuthorizationInput"
		}
	},
	Mutation:{
		userMutation:{

		}
	},
	UserMutation:{
		sendStaticNotification:{
			input:"SendStaticNotificationInput"
		},
		sendPushNotificationToUsers:{
			input:"SendPushNotificationInput"
		},
		sendPushNotificationToInterests:{
			input:"SendPushNotificationInput"
		}
	},
	GetChannelAuthorizationInput:{

	},
	SendStaticNotificationInput:{

	},
	SendPushNotificationInput:{
		notification:"NotificationPayloadInput"
	},
	NotificationPayloadInput:{

	}
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		userQuery:"UserQuery"
	},
	UserQuery:{
		getChannelAuthorization:"GetChannelAuthorizationResult",
		getPushNotificationToken:"GetPushNotificationTokenResult"
	},
	Mutation:{
		userMutation:"UserMutation"
	},
	UserMutation:{
		sendStaticNotification:"SendNotificationResult",
		sendPushNotificationToUsers:"SendNotificationResult",
		sendPushNotificationToInterests:"SendNotificationResult"
	},
	GetPushNotificationTokenResult:{
		error:"GlobalError",
		token:"String"
	},
	GetChannelAuthorizationResult:{
		error:"GlobalError",
		auth:"String",
		channel_data:"String",
		shared_secret:"String"
	},
	SendNotificationResult:{
		error:"GlobalError",
		result:"Boolean"
	},
	GlobalError:{
		message:"String",
		path:"String"
	},
	error:{
		error:"GlobalError"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}