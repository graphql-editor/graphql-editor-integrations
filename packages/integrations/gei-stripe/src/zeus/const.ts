/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		products:{
			filter:"ProductFilter"
		},
		subscriptions:{
			filter:"SubscriptionFilter"
		},
		paymentIntents:{
			filter:"PaymentIntentFilter"
		},
		invoices:{
			filter:"InvoiceFilter"
		},
		customer:{

		}
	},
	Mutation:{
		initStripeCustomer:{
			initStripeCustomerInput:"InitStripeCustomerInput"
		},
		createCheckoutSession:{
			payload:"CreateCheckoutSessionInput"
		},
		createNewUserCheckoutSession:{
			payload:"CreateNewUserCheckoutSessionInput"
		},
		createCustomerPortal:{
			payload:"CreateCustomerPortalInput"
		},
		createConnectAccount:{
			payload:"CreateConnectAccountInput"
		},
		attachPaymentMethod:{
			payload:"AttachPaymentMethodInput"
		},
		setDefaultPaymentMethod:{
			payload:"setDefaultPaymentMethodInput"
		},
		createPayoutForConnectedAccount:{
			payload:"createPayoutForConnectedAccountInput"
		}
	},
	createPayoutForConnectedAccountInput:{

	},
	PaymentIntentStatus: "enum" as const,
	InvoiceStatus: "enum" as const,
	InvoiceCollectionMethod: "enum" as const,
	PaymentIntentSetupFutureUsage: "enum" as const,
	InvoiceFilter:{
		status:"InvoiceStatus"
	},
	PaymentIntentFilter:{
		status:"PaymentIntentStatus"
	},
	setDefaultPaymentMethodInput:{

	},
	AttachPaymentMethodInput:{

	},
	CreateConnectAccountInput:{
		type:"ConnectAccountType",
		business_type:"ConnectAccountBusinessType",
		bankAccount:"BankAccountInput"
	},
	ConnectAccountBusinessType: "enum" as const,
	ConnectAccountType: "enum" as const,
	BankAccountInput:{
		account_holder_type:"BankAccountHolderType"
	},
	BankAccountHolderType: "enum" as const,
	SubscriptionFilter:{

	},
	SubStatus: "enum" as const,
	InitStripeCustomerInput:{
		address:"AddressInput"
	},
	CreateNewUserCheckoutSessionInput:{
		products:"ProductInput",
		applicationFee:"ApplicationFeeInput"
	},
	CreateCheckoutSessionInput:{
		products:"ProductInput",
		applicationFee:"ApplicationFeeInput"
	},
	ApplicationFeeInput:{

	},
	ProductInput:{

	},
	CreateCustomerPortalInput:{

	},
	AddressInput:{

	},
	PaymentMethodType: "enum" as const,
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
		products:"ProductsPage",
		subscriptions:"Subscription",
		paymentIntents:"PaymentIntent",
		invoices:"Invoice",
		customer:"Customer"
	},
	Mutation:{
		initStripeCustomer:"Boolean",
		createCheckoutSession:"String",
		createNewUserCheckoutSession:"String",
		createCustomerPortal:"String",
		createConnectAccount:"Boolean",
		attachPaymentMethod:"Boolean",
		setDefaultPaymentMethod:"Boolean",
		createPayoutForConnectedAccount:"Boolean",
		webhook:"String"
	},
	Invoice:{
		id:"String",
		account_country:"String",
		account_name:"String",
		account_tax_id:"String",
		amount_due:"Int",
		amount_paid:"Int",
		amount_remaining:"Int",
		amount_shipping:"Int",
		application_fee_amount:"Int",
		attempt_count:"Int",
		attempted:"Boolean",
		auto_advance:"Boolean",
		billing_reason:"String",
		charge:"String",
		collection_method:"InvoiceCollectionMethod",
		created:"Timestamp",
		currency:"String",
		customer:"String",
		customer_address:"Address",
		customer_email:"String",
		customer_name:"String",
		description:"String",
		hosted_invoice_url:"String",
		period_end:"Timestamp",
		period_start:"Timestamp",
		status:"InvoiceStatus",
		subscription:"String",
		total:"Int"
	},
	PaymentIntent:{
		id:"String",
		client_secret:"String",
		amount:"Int",
		amount_capturable:"Int",
		amount_received:"Int",
		application_fee_amount:"Int",
		capture_method:"String",
		confirmation_method:"String",
		created:"Timestamp",
		currency:"String",
		customer:"String",
		description:"String",
		invoice:"String",
		latest_charge:"String",
		livemode:"Boolean",
		payment_method:"String",
		setup_future_usage:"String",
		status:"PaymentIntentStatus",
		transfer_group:"String",
		last_payment_error:"PaymentIntentLastPaymentError",
		on_behalf_of:"String"
	},
	PaymentIntentLastPaymentError:{
		type:"String",
		charge:"String",
		code:"String",
		decline_code:"String",
		doc_url:"String",
		message:"String",
		param:"String",
		payment_method_type:"String"
	},
	Subscription:{
		id:"String",
		cancel_at_period_end:"Boolean",
		current_period_end:"Timestamp",
		current_period_start:"Timestamp",
		customer:"String",
		description:"String",
		items:"SubscriptionItems",
		quantity:"Int",
		status:"SubStatus"
	},
	SubscriptionItems:{
		data:"Item",
		has_more:"Boolean",
		total_count:"Int",
		url:"String",
		object:"String"
	},
	Item:{
		id:"String",
		created:"Timestamp",
		metadata:"AnyObject",
		price:"Price",
		quantity:"Int",
		subscription:"String"
	},
	User:{
		stripeId:"String",
		email:"String"
	},
	Customer:{
		id:"String",
		email:"String",
		name:"String",
		address:"Address",
		phone:"String",
		created:"Timestamp",
		invoicePrefix:"String",
		paymentMethods:"PaymentMethod"
	},
	PaymentMethod:{
		id:"String",
		billing_details:"PaymentBillingDetails",
		customer:"String",
		metadata:"AnyObject",
		type:"PaymentMethodType",
		created:"Timestamp",
		livemode:"Boolean"
	},
	PaymentBillingDetails:{
		address:"Address",
		email:"String",
		name:"String",
		phone:"String"
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
	mutation: "Mutation" as const,
	subscription: "Subscription" as const
}