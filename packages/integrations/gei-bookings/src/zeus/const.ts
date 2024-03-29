/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	UserQuery:{
		getSelfBooks:{
			input:"GetBooksInput"
		},
		getBookingsForService:{
			input:"GetBookingsForServiceInput"
		},
		getSelfServices:{
			input:"GetSelfServicesInput"
		}
	},
	PublicQuery:{
		listServices:{
			input:"ListServicesInput"
		},
		getService:{

		}
	},
	UserMutation:{
		registerService:{
			input:"RegisterServiceInput"
		},
		updateService:{
			input:"UpdateServiceInput"
		},
		removeService:{

		},
		bookService:{
			input:"BookServiceInput"
		},
		send:{
			mailgunData:"MailgunData"
		},
		respondOnServiceRequest:{
			input:"RespondOnServiceRequestInput"
		}
	},
	MailgunData:{

	},
	GetBookingsForServiceInput:{
		page:"PageOptionsInput",
		filters:"GetBookingsForServiceFiltersInput"
	},
	GetBookingsForServiceFiltersInput:{
		fromDate:"Date",
		toDate:"Date",
		status:"BookStatus"
	},
	RespondOnServiceRequestInput:{
		answer:"BookStatus"
	},
	GetSelfServicesInput:{
		page:"PageOptionsInput",
		filters:"GetSelfServicesFiltersInput"
	},
	GetSelfServicesFiltersInput:{
		fromDate:"Date",
		toDate:"Date"
	},
	GetBooksInput:{
		page:"PageOptionsInput",
		filters:"GetBooksFiltersInput"
	},
	GetBooksFiltersInput:{

	},
	ListServicesInput:{
		page:"PageOptionsInput",
		filters:"ListServicesFiltersInput"
	},
	RegisterUserInput:{

	},
	RegisterServiceInput:{
		startDates:"Date"
	},
	UpdateServiceInput:{
		startDate:"Date"
	},
	BookServiceInput:{

	},
	PageOptionsInput:{

	},
	ListServicesFiltersInput:{
		fromDate:"Date",
		toDate:"Date"
	},
	Date: `scalar.Date` as const,
	BookStatus: "enum" as const,
	ServiceType: "enum" as const
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		user:"UserQuery",
		public:"PublicQuery"
	},
	UserQuery:{
		getSelfBooks:"GetBooksRepsond",
		getBookingsForService:"GetBookingsForServiceRespond",
		getSelfServices:"GetSelfServicesRespond"
	},
	Mutation:{
		user:"UserMutation"
	},
	PublicQuery:{
		listServices:"ListServicesRespond",
		getService:"GetServiceRespond"
	},
	UserMutation:{
		registerService:"RegisterServiceRespond",
		updateService:"UpdateServiceRespond",
		removeService:"RemoveServiceRespond",
		bookService:"BookServiceRespond",
		send:"String",
		respondOnServiceRequest:"RespondOnServiceRequestRespond"
	},
	GetBookingsForServiceRespond:{
		books:"BookingRecord",
		error:"GlobalError"
	},
	GetSelfServicesRespond:{
		service:"Service",
		error:"GlobalError"
	},
	RespondOnServiceRequestRespond:{
		status:"Boolean",
		error:"GlobalError"
	},
	GetBooksRepsond:{
		books:"BookingRecord",
		error:"GlobalError"
	},
	ListServicesRespond:{
		services:"Service",
		error:"GlobalError"
	},
	GetServiceRespond:{
		service:"Service",
		error:"GlobalError"
	},
	RegisterServiceRespond:{
		service:"Service",
		error:"GlobalError"
	},
	UpdateServiceRespond:{
		service:"Service",
		error:"GlobalError"
	},
	RemoveServiceRespond:{
		removed:"Boolean",
		error:"GlobalError"
	},
	BookServiceRespond:{
		book:"BookingRecord",
		error:"GlobalError"
	},
	UserServiceRespond:{
		service:"Service",
		error:"GlobalError"
	},
	Service:{
		name:"String",
		description:"String",
		ownerId:"String",
		time:"Int",
		startDate:"Date",
		_id:"String",
		createdAt:"Date",
		updatedAt:"Date",
		active:"Boolean",
		taken:"Boolean",
		neededAccept:"Boolean"
	},
	BookingRecord:{
		bookerId:"String",
		services:"Service",
		comments:"String",
		_id:"String",
		createdAt:"Date",
		status:"BookStatus",
		answeredAt:"Date"
	},
	GlobalError:{
		message:"String",
		path:"String"
	},
	dbEssentials:{
		"...on Service": "Service",
		"...on BookingRecord": "BookingRecord",
		_id:"String",
		createdAt:"Date"
	},
	Date: `scalar.Date` as const
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}