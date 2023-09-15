/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	BookingsUserQuery:{
		getSelfBooks:{
			input:"BookingsGetBooksInput"
		},
		getBookingsForService:{
			input:"BookingsGetBookingsForServiceInput"
		},
		getSelfServices:{
			input:"BookingsGetSelfServicesInput"
		}
	},
	BookingsPublicQuery:{
		listServices:{
			input:"BookingsListServicesInput"
		},
		getService:{

		}
	},
	BookingsUserMutation:{
		registerService:{
			input:"BookingsRegisterServiceInput"
		},
		updateService:{
			input:"BookingsUpdateServiceInput"
		},
		removeService:{

		},
		bookService:{
			input:"BookingsBookServiceInput"
		},
		respondOnServiceRequest:{
			input:"BookingsRespondOnServiceRequestInput"
		}
	},
	BookingsGetBookingsForServiceInput:{
		page:"BookingsPageOptionsInput",
		filters:"BookingsGetBookingsForServiceFiltersInput"
	},
	BookingsGetBookingsForServiceFiltersInput:{
		fromDate:"BookingsDate",
		toDate:"BookingsDate",
		status:"BookingsBookStatus"
	},
	BookingsRespondOnServiceRequestInput:{
		answer:"BookingsBookStatus"
	},
	BookingsGetSelfServicesInput:{
		page:"BookingsPageOptionsInput",
		filters:"BookingsGetSelfServicesFiltersInput"
	},
	BookingsGetSelfServicesFiltersInput:{
		fromDate:"BookingsDate",
		toDate:"BookingsDate"
	},
	BookingsGetBooksInput:{
		page:"BookingsPageOptionsInput",
		filters:"BookingsGetBooksFiltersInput"
	},
	BookingsGetBooksFiltersInput:{

	},
	BookingsListServicesInput:{
		page:"BookingsPageOptionsInput",
		filters:"BookingsListServicesFiltersInput"
	},
	BookingsRegisterUserInput:{

	},
	BookingsRegisterServiceInput:{
		startDate:"BookingsDate"
	},
	BookingsUpdateServiceInput:{
		startDate:"BookingsDate"
	},
	BookingsBookServiceInput:{

	},
	BookingsPageOptionsInput:{

	},
	BookingsListServicesFiltersInput:{
		fromDate:"BookingsDate",
		toDate:"BookingsDate"
	},
	BookingsDate: `scalar.BookingsDate` as const,
	BookingsBookStatus: "enum" as const,
	BookingsServiceType: "enum" as const
}

export const ReturnTypes: Record<string,any> = {
	UserQuery:{
		randomQuery:"String",
		bookingUserQuery:"BookingsUserQuery"
	},
	UserMutation:{
		randomMutation:"String"
	},
	Mutation:{
		user:"UserMutation"
	},
	PublicQuery:{
		bookingPublicQuery:"BookingsPublicQuery"
	},
	Query:{
		user:"UserQuery",
		public:"PublicQuery"
	},
	BookingsQuery:{
		user:"BookingsUserQuery",
		public:"BookingsPublicQuery"
	},
	BookingsUserQuery:{
		getSelfBooks:"BookingsGetBooksRepsond",
		getBookingsForService:"BookingsGetBookingsForServiceRespond",
		getSelfServices:"BookingsGetSelfServicesRespond"
	},
	BookingsMutation:{
		user:"BookingsUserMutation"
	},
	BookingsPublicQuery:{
		listServices:"BookingsListServicesRespond",
		getService:"BookingsGetServiceRespond"
	},
	BookingsUserMutation:{
		registerService:"BookingsRegisterServiceRespond",
		updateService:"BookingsUpdateServiceRespond",
		removeService:"BookingsRemoveServiceRespond",
		bookService:"BookingsBookServiceRespond",
		respondOnServiceRequest:"BookingsRespondOnServiceRequestRespond"
	},
	BookingsGetBookingsForServiceRespond:{
		books:"BookingsBookingRecord",
		error:"BookingsGlobalError"
	},
	BookingsGetSelfServicesRespond:{
		service:"BookingsService",
		error:"BookingsGlobalError"
	},
	BookingsRespondOnServiceRequestRespond:{
		status:"Boolean",
		error:"BookingsGlobalError"
	},
	BookingsGetBooksRepsond:{
		books:"BookingsBookingRecord",
		error:"BookingsGlobalError"
	},
	BookingsListServicesRespond:{
		services:"BookingsService",
		error:"BookingsGlobalError"
	},
	BookingsGetServiceRespond:{
		service:"BookingsService",
		error:"BookingsGlobalError"
	},
	BookingsRegisterServiceRespond:{
		service:"BookingsService",
		error:"BookingsGlobalError"
	},
	BookingsUpdateServiceRespond:{
		service:"BookingsService",
		error:"BookingsGlobalError"
	},
	BookingsRemoveServiceRespond:{
		removed:"Boolean",
		error:"BookingsGlobalError"
	},
	BookingsBookServiceRespond:{
		book:"BookingsBookingRecord",
		error:"BookingsGlobalError"
	},
	BookingsUserServiceRespond:{
		service:"BookingsService",
		error:"BookingsGlobalError"
	},
	BookingsService:{
		name:"String",
		description:"String",
		ownerId:"String",
		time:"Int",
		startDate:"BookingsDate",
		_id:"String",
		createdAt:"BookingsDate",
		updatedAt:"BookingsDate",
		active:"Boolean",
		taken:"Boolean",
		neededAccept:"Boolean"
	},
	BookingsBookingRecord:{
		bookerId:"String",
		service:"BookingsService",
		comments:"String",
		_id:"String",
		createdAt:"BookingsDate",
		status:"BookingsBookStatus",
		answeredAt:"BookingsDate"
	},
	BookingsGlobalError:{
		message:"String",
		path:"String"
	},
	BookingsdbEssentials:{
		"...on BookingsService": "BookingsService",
		"...on BookingsBookingRecord": "BookingsBookingRecord",
		_id:"String",
		createdAt:"BookingsDate"
	},
	BookingsDate: `scalar.BookingsDate` as const
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}