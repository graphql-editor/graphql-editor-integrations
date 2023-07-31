/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		products:{
			filter:"ProductFilter"
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
	InitStripeCustomerInput:{
		address:"AddressInput"
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
	AddressInput:{

	},
	ProductFilter:{
		created:"TimestampFilter"
	},
	RecurringFilter:{
		interval:"Interval",
		usageType:"UsageType"
	},
	PriceFilter:{
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
		products:"ProductsPage"
	},
	Mutation:{
		initStripeCustomer:"Boolean",
		createPaymentSession:"String",
		createNewUserPaymentSession:"String",
		createCustomerPortal:"String",
		webhook:"String"
	},
	User:{
		stripeId:"String",
		email:"String"
	},
	StripeCustomer:{
		customerId:"String",
		email:"String",
		name:"String",
		address:"Address"
	},
	Address:{
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
	Product:{
		id:"ID",
		active:"Boolean",
		created:"Timestamp",
		default_price:"Price",
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
		prices:"Price"
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
	Price:{
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
		product:"Product",
		recurring:"PriceRecurring",
		tax_behavior:"TaxBehaviour",
		tiers_mode:"TiersMode",
		transform_quantity:"TransformQuantity",
		type:"Type",
		unit_amount:"Int",
		unit_amount_decimal:"String"
	},
	ProductsPage:{
		products:"Product",
		startingAfter:"ID",
		endingBefore:"ID"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}