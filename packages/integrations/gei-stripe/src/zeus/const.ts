/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		stripeCustomerQueryOps:{

		}
	},
	Mutation:{
		initStripeCustomer:{
			initStripeCustomerInput:"InitStripeCustomerInput"
		},
		stripeCustomerMutationOps:{

		}
	},
	StripeCustomerMutationOps:{
		generateBillingPortal:{

		},
		generateCheckoutSession:{
			generateCheckoutSessionInput:"GenerateCheckoutSessionInput"
		}
	},
	GenerateCheckoutSessionInput:{

	},
	InitStripeCustomerInput:{
		address:"AddressInput"
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
	Store:{
		products:{
			filter:"ProductFilter"
		},
		prices:{
			filter:"PriceFilter"
		}
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
		store:"Store",
		stripeCustomerQueryOps:"StripeCustomerQueryOps"
	},
	StripeCustomerQueryOps:{
		getCustomerInfo:"StripeCustomer"
	},
	Mutation:{
		initStripeCustomer:"Boolean",
		stripeCustomerMutationOps:"StripeCustomerMutationOps",
		webhook:"String"
	},
	StripeCustomerMutationOps:{
		generateBillingPortal:"String",
		generateCheckoutSession:"String"
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
	Store:{
		products:"ProductsPage",
		prices:"PricesPage"
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
		defaultPrice:"Price",
		description:"String",
		images:"String",
		livemode:"Boolean",
		metadata:"AnyObject",
		name:"String",
		packageDimensions:"Dimensions",
		shippable:"Boolean",
		statementDescriptor:"String",
		taxCode:"String",
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
		aggregateUsage:"AggregateUsage",
		interval:"Interval",
		intervalCount:"Int",
		usageType:"UsageType",
		trialPeriodDays:"Int"
	},
	TransformQuantity:{
		divideBy:"Int",
		round:"Round"
	},
	Price:{
		id:"ID",
		active:"Boolean",
		billingScheme:"BillingScheme",
		created:"Timestamp",
		currency:"String",
		customUnitAmount:"CustomUnitAmount",
		livemode:"Boolean",
		lookupKey:"String",
		metadata:"AnyObject",
		nickname:"String",
		product:"Product",
		recurring:"PriceRecurring",
		taxBehavior:"TaxBehaviour",
		tiersMode:"TiersMode",
		transformQuantity:"TransformQuantity",
		type:"Type",
		unitAmount:"Int",
		unitAmountDecimal:"String"
	},
	ProductsPage:{
		products:"Product",
		startingAfter:"ID",
		endingBefore:"ID"
	},
	PricesPage:{
		products:"Price",
		startingAfter:"ID",
		endingBefore:"ID"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}