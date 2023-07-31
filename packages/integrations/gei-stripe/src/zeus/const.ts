/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		products:{
			filter:"StripeProductFilter"
		},
		subscriptions:{
			filter:"StripeSubscriptionFilter"
		}
	},
	Mutation:{
		initStripeCustomer:{
			initStripeCustomerInput:"InitStripeCustomerInput"
		},
		createPaymentSession:{
			payload:"CreatePaymentSessionPayload"
		},
		createNewUserPaymentSession:{
			payload:"CreateNewUserPaymentSessionPayload"
		},
		createCustomerPortal:{
			payload:"CreateCustomerPortalPayload"
		}
	},
	StripeSubscriptionFilter:{

	},
	StripeSubStatus: "enum" as const,
	InitStripeCustomerInput:{
		address:"StripeAddressInput"
	},
	CreateNewUserPaymentSessionPayload:{
		products:"StripeProductInput"
	},
	CreatePaymentSessionPayload:{
		products:"StripeProductInput"
	},
	StripeProductInput:{

	},
	CreateCustomerPortalPayload:{

	},
	StripeAddressInput:{

	},
	StripeProductFilter:{
		created:"TimestampFilter"
	},
	RecurringFilter:{
		interval:"Interval",
		usageType:"UsageType"
	},
	StripePriceFilter:{
		type:"Type",
		created:"TimestampFilter",
		recurring:"RecurringFilter"
	},
	BillingScheme: "enum" as const,
	Timestamp: `scalar.Timestamp` as const,
	TimestampFilter:{
		Gt:"Timestamp",
		Gte:"Timestamp",
		Lt:"Timestamp",
		Lte:"Timestamp"
	},
	AnyObject: `scalar.AnyObject` as const,
	AggregateUsage: "enum" as const,
	Interval: "enum" as const,
	UsageType: "enum" as const,
	TaxBehaviour: "enum" as const,
	TiersMode: "enum" as const,
	Round: "enum" as const,
	Type: "enum" as const
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		products:"StripeProductsPage",
		subscriptions:"StripeSubscription"
	},
	Mutation:{
		initStripeCustomer:"Boolean",
		createPaymentSession:"String",
		createNewUserPaymentSession:"String",
		createCustomerPortal:"String",
		webhook:"String"
	},
	StripeSubscription:{
		id:"String",
		cancel_at_period_end:"Boolean",
		current_period_end:"Timestamp",
		current_period_start:"Timestamp",
		customer:"String",
		description:"String",
		items:"StripeItem",
		quantity:"Int",
		start:"Timestamp",
		status:"StripeSubStatus"
	},
	StripeItem:{
		id:"String",
		created:"Timestamp",
		metadata:"AnyObject",
		price:"StripePrice",
		quantity:"Int",
		subscription:"String"
	},
	StripeUser:{
		stripeId:"String",
		email:"String"
	},
	StripeCustomer:{
		customerId:"String",
		email:"String",
		name:"String",
		address:"StripeAddress"
	},
	StripeAddress:{
		city:"String",
		country:"String",
		line1:"String",
		line2:"String",
		postal_code:"String",
		state:"String"
	},
	Dimensions:{
		height:"Float",
		length:"Float",
		weight:"Float",
		width:"Float"
	},
	StripeProduct:{
		id:"ID",
		active:"Boolean",
		created:"Timestamp",
		default_price:"StripePrice",
		description:"String",
		images:"String",
		livemode:"Boolean",
		metadata:"AnyObject",
		name:"String",
		package_dimensions:"Dimensions",
		shippable:"Boolean",
		statement_descriptor:"String",
		tax_code:"String",
		unitLabel:"String",
		updated:"Timestamp",
		url:"String",
		prices:"StripePrice"
	},
	Timestamp: `scalar.Timestamp` as const,
	CustomUnitAmount:{
		maximum:"Int",
		minimum:"Int",
		preset:"Int"
	},
	AnyObject: `scalar.AnyObject` as const,
	PriceRecurring:{
		aggregate_usage:"AggregateUsage",
		interval:"Interval",
		interval_count:"Int",
		usage_type:"UsageType",
		trial_period_days:"Int"
	},
	TransformQuantity:{
		divideBy:"Int",
		round:"Round"
	},
	StripePrice:{
		id:"ID",
		active:"Boolean",
		billing_scheme:"BillingScheme",
		created:"Timestamp",
		currency:"String",
		custom_unit_amount:"CustomUnitAmount",
		livemode:"Boolean",
		lookup_key:"String",
		metadata:"AnyObject",
		nickname:"String",
		product:"StripeProduct",
		recurring:"PriceRecurring",
		tax_behavior:"TaxBehaviour",
		tiers_mode:"TiersMode",
		transform_quantity:"TransformQuantity",
		type:"Type",
		unit_amount:"Int",
		unit_amount_decimal:"String"
	},
	StripeProductsPage:{
		products:"StripeProduct",
		startingAfter:"ID",
		endingBefore:"ID"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}