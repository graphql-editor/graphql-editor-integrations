/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		userQuery:{

		}
	},
	UserQuery:{
		listNotifications:{
			input:"ListNotificationsInput"
		},
		listChannels:{
			input:"ListChannelsInput"
		}
	},
	Mutation:{
		userMutation:{

		}
	},
	UserMutation:{
		markNotificationReaded:{
			input:"MarkNotificationReadedInput"
		},
		sendStaticNotification:{
			input:"SendStaticNotificationInput"
		},
		sendPushNotification:{
			input:"SendPushNotificationInput"
		},
		getChannelAuthorization:{
			input:"GetChannelAuthorizationInput"
		},
		createNotificationGroup:{
			input:"CreateNotificationGroupInput"
		},
		modifyNotifactionGroup:{

		}
	},
	PublicQuery:{
		listNotificationGroups:{
			input:"ListNotificationGroupsInput"
		}
	},
	NotificationGroupOps:{
		addUserToGroup:{

		},
		removeUserFromGroup:{

		},
		editNotificationGroup:{
			input:"EditNotificationGroupInput"
		}
	},
	GetChannelAuthorizationInput:{

	},
	ListChannelsInput:{
		page:"PageOptionsInput"
	},
	ListNotificationGroupsInput:{
		page:"PageOptionsInput",
		filter:"ListNotificationGroupsInputFilter"
	},
	ListNotificationGroupsInputFilter:{
		sortDirection:"SortDirection",
		notificationType:"NotificationType",
		startDate:"Date",
		endDate:"Date"
	},
	ListNotificationsInput:{
		filter:"ListNotificationsInputFilter",
		page:"PageOptionsInput"
	},
	ListNotificationsInputFilter:{
		notificationType:"NotificationType",
		sortDirection:"SortDirection",
		startDate:"Date",
		endDate:"Date"
	},
	SendStaticNotificationInput:{

	},
	SendPushNotificationInput:{
		notification:"NotificationPayloadInput"
	},
	NotificationPayloadInput:{

	},
	EditNotificationGroupInput:{

	},
	CreateNotificationGroupInput:{
		notificationType:"NotificationType"
	},
	MarkNotificationReadedInput:{

	},
	PageOptionsInput:{

	},
	NotificationTargetType: "enum" as const,
	SortDirection: "enum" as const,
	NotificationType: "enum" as const,
	Date: `scalar.Date` as const
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		userQuery:"UserQuery",
		publicQuery:"PublicQuery"
	},
	UserQuery:{
		listNotifications:"ListNotificationsResult",
		listChannels:"ListChannelsResult",
		generatePushNotificationToken:"GeneratePushNotificationTokenResult"
	},
	Mutation:{
		userMutation:"UserMutation"
	},
	UserMutation:{
		markNotificationReaded:"MarkNotificationReadedResult",
		sendStaticNotification:"SendStaticNotificationResult",
		sendPushNotification:"SendStaticNotificationResult",
		getChannelAuthorization:"GetChannelAuthorizationResult",
		createNotificationGroup:"CreateNotificationGroupResult",
		modifyNotifactionGroup:"NotificationGroupOps"
	},
	PublicQuery:{
		listNotificationGroups:"ListNotificationGroupsResult"
	},
	NotificationGroupOps:{
		addUserToGroup:"AddUserToGroupResult",
		removeUserFromGroup:"RemoveUserToGroupResult",
		editNotificationGroup:"EditNotificationGroupResult",
		deleteNotificationGroup:"DeleteNotificationGroupResult"
	},
	GeneratePushNotificationTokenResult:{
		error:"GlobalError",
		token:"String",
		exp:"Date"
	},
	GetChannelAuthorizationResult:{
		error:"GlobalError",
		auth:"String",
		channel_data:"String",
		shared_secret:"String"
	},
	ListChannelsResult:{
		error:"GlobalError",
		result:"Channel",
		page:"PageOptionsResult"
	},
	DeleteNotificationGroupResult:{
		error:"GlobalError",
		result:"Boolean"
	},
	SendStaticNotificationResult:{
		error:"GlobalError",
		result:"Boolean"
	},
	EditNotificationGroupResult:{
		error:"GlobalError",
		result:"Boolean"
	},
	AddUserToGroupResult:{
		result:"Boolean",
		error:"GlobalError"
	},
	RemoveUserToGroupResult:{
		result:"Boolean",
		error:"GlobalError"
	},
	CreateNotificationGroupResult:{
		error:"GlobalError",
		result:"Boolean"
	},
	MarkNotificationReadedResult:{
		error:"GlobalError",
		result:"Boolean"
	},
	ListNotificationGroupsResult:{
		error:"GlobalError",
		notificationGroup:"NotificationGroup"
	},
	ListNotificationsResult:{
		error:"GlobalError",
		notification:"Notification",
		page:"PageOptionsResult"
	},
	GlobalError:{
		message:"String",
		path:"String"
	},
	Notification:{
		body:"String",
		targetIds:"String",
		_id:"String",
		createdAt:"Date",
		isReaded:"Boolean",
		notificationType:"NotificationType"
	},
	NotificationGroup:{
		targets:"String",
		notificationType:"NotificationType",
		name:"String",
		_id:"String",
		createdAt:"Date"
	},
	NotificationReaded:{
		userId:"String",
		notificationId:"String",
		createdAt:"Date"
	},
	Channel:{
		channelId:"String",
		createdAt:"Date"
	},
	PageOptionsResult:{
		count:"Int",
		hasNext:"Boolean"
	},
	DbEssentials:{
		"...on Notification": "Notification",
		"...on NotificationGroup": "NotificationGroup",
		_id:"String",
		createdAt:"Date"
	},
	error:{
		"...on AddUserToGroupResult": "AddUserToGroupResult",
		"...on RemoveUserToGroupResult": "RemoveUserToGroupResult",
		"...on CreateNotificationGroupResult": "CreateNotificationGroupResult",
		"...on ListNotificationGroupsResult": "ListNotificationGroupsResult",
		"...on ListNotificationsResult": "ListNotificationsResult",
		error:"GlobalError"
	},
	Date: `scalar.Date` as const
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}