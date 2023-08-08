/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	StripeQuery:{
		products:{
			filter:"StripeProductFilter"
		},
		subscriptions:{
			filter:"StripeSubscriptionFilter"
		},
		paymentIntents:{
			filter:"StripePaymentIntentFilter"
		},
		invoices:{
			filter:"StripeInvoiceFilter"
		},
		customer:{

		}
	},
	StripeMutation:{
		initStripeCustomer:{
			initStripeCustomerInput:"StripeInitStripeCustomerInput"
		},
		createCheckoutSession:{
			payload:"StripeCreateCheckoutSessionInput"
		},
		createNewUserCheckoutSession:{
			payload:"StripeCreateNewUserCheckoutSessionInput"
		},
		createCustomerPortal:{
			payload:"StripeCreateCustomerPortalInput"
		},
		createConnectAccount:{
			payload:"StripeCreateConnectAccountInput"
		},
		attachPaymentMethod:{
			payload:"StripeAttachPaymentMethodInput"
		},
		setDefaultPaymentMethod:{
			payload:"StripesetDefaultPaymentMethodInput"
		},
		createPayoutForConnectedAccount:{
			payload:"StripecreatePayoutForConnectedAccountInput"
		}
	},
	StripecreatePayoutForConnectedAccountInput:{

	},
	StripePaymentIntentStatus: "enum" as const,
	StripeInvoiceStatus: "enum" as const,
	StripeInvoiceCollectionMethod: "enum" as const,
	StripePaymentIntentSetupFutureUsage: "enum" as const,
	StripeInvoiceFilter:{
		status:"StripeInvoiceStatus"
	},
	StripePaymentIntentFilter:{
		status:"StripePaymentIntentStatus"
	},
	StripesetDefaultPaymentMethodInput:{

	},
	StripeAttachPaymentMethodInput:{

	},
	StripeCreateConnectAccountInput:{
		type:"StripeConnectAccountType",
		business_type:"StripeConnectAccountBusinessType",
		bankAccount:"StripeBankAccountInput"
	},
	StripeConnectAccountBusinessType: "enum" as const,
	StripeConnectAccountType: "enum" as const,
	StripeBankAccountInput:{
		account_holder_type:"StripeBankAccountHolderType"
	},
	StripeBankAccountHolderType: "enum" as const,
	StripeSubscriptionFilter:{

	},
	StripeSubStatus: "enum" as const,
	StripeInitStripeCustomerInput:{
		address:"StripeAddressInput"
	},
	StripeCreateNewUserCheckoutSessionInput:{
		products:"StripeProductInput",
		applicationFee:"StripeApplicationFeeInput"
	},
	StripeCreateCheckoutSessionInput:{
		products:"StripeProductInput",
		applicationFee:"StripeApplicationFeeInput"
	},
	StripeApplicationFeeInput:{

	},
	StripeProductInput:{

	},
	StripeCreateCustomerPortalInput:{

	},
	StripeAddressInput:{

	},
	StripePaymentMethodType: "enum" as const,
	StripeProductFilter:{
		created:"StripeTimestampFilter"
	},
	StripeRecurringFilter:{
		interval:"StripeInterval",
		usageType:"StripeUsageType"
	},
	StripePriceFilter:{
		type:"StripeType",
		created:"StripeTimestampFilter",
		recurring:"StripeRecurringFilter"
	},
	StripeBillingScheme: "enum" as const,
	StripeTimestamp: `scalar.StripeTimestamp` as const,
	StripeTimestampFilter:{
		Gt:"StripeTimestamp",
		Gte:"StripeTimestamp",
		Lt:"StripeTimestamp",
		Lte:"StripeTimestamp"
	},
	StripeAnyObject: `scalar.StripeAnyObject` as const,
	StripeAggregateUsage: "enum" as const,
	StripeInterval: "enum" as const,
	StripeUsageType: "enum" as const,
	StripeTaxBehaviour: "enum" as const,
	StripeTiersMode: "enum" as const,
	StripeRound: "enum" as const,
	StripeType: "enum" as const
}

export const ReturnTypes: Record<string,any> = {
	StripeQuery:{
		products:"StripeProductsPage",
		subscriptions:"StripeSubscription",
		paymentIntents:"StripePaymentIntent",
		invoices:"StripeInvoice",
		customer:"StripeCustomer"
	},
	StripeMutation:{
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
	StripeInvoice:{
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
		collection_method:"StripeInvoiceCollectionMethod",
		created:"StripeTimestamp",
		currency:"String",
		customer:"String",
		customer_address:"StripeAddress",
		customer_email:"String",
		customer_name:"String",
		description:"String",
		hosted_invoice_url:"String",
		period_end:"StripeTimestamp",
		period_start:"StripeTimestamp",
		status:"StripeInvoiceStatus",
		subscription:"String",
		total:"Int"
	},
	StripePaymentIntent:{
		id:"String",
		client_secret:"String",
		amount:"Int",
		amount_capturable:"Int",
		amount_received:"Int",
		application_fee_amount:"Int",
		capture_method:"String",
		confirmation_method:"String",
		created:"StripeTimestamp",
		currency:"String",
		customer:"String",
		description:"String",
		invoice:"String",
		latest_charge:"String",
		livemode:"Boolean",
		payment_method:"String",
		setup_future_usage:"String",
		status:"StripePaymentIntentStatus",
		transfer_group:"String",
		last_payment_error:"StripePaymentIntentLastPaymentError",
		on_behalf_of:"String"
	},
	StripePaymentIntentLastPaymentError:{
		type:"String",
		charge:"String",
		code:"String",
		decline_code:"String",
		doc_url:"String",
		message:"String",
		param:"String",
		payment_method_type:"String"
	},
	StripeSubscription:{
		id:"String",
		cancel_at_period_end:"Boolean",
		current_period_end:"StripeTimestamp",
		current_period_start:"StripeTimestamp",
		customer:"String",
		description:"String",
		items:"StripeSubscriptionItems",
		quantity:"Int",
		status:"StripeSubStatus"
	},
	StripeSubscriptionItems:{
		data:"StripeItem",
		has_more:"Boolean",
		total_count:"Int",
		url:"String",
		object:"String"
	},
	StripeItem:{
		id:"String",
		created:"StripeTimestamp",
		metadata:"StripeAnyObject",
		price:"StripePrice",
		quantity:"Int",
		subscription:"String"
	},
	StripeUser:{
		stripeId:"String",
		email:"String"
	},
	StripeCustomer:{
		id:"String",
		email:"String",
		name:"String",
		address:"StripeAddress",
		phone:"String",
		created:"StripeTimestamp",
		invoicePrefix:"String",
		paymentMethods:"StripePaymentMethod"
	},
	StripePaymentMethod:{
		id:"String",
		billing_details:"StripePaymentBillingDetails",
		customer:"String",
		metadata:"StripeAnyObject",
		type:"StripePaymentMethodType",
		created:"StripeTimestamp",
		livemode:"Boolean"
	},
	StripePaymentBillingDetails:{
		address:"StripeAddress",
		email:"String",
		name:"String",
		phone:"String"
	},
	StripeAddress:{
		city:"String",
		country:"String",
		line1:"String",
		line2:"String",
		postal_code:"String",
		state:"String"
	},
	StripeDimensions:{
		height:"Float",
		length:"Float",
		weight:"Float",
		width:"Float"
	},
	StripeProduct:{
		id:"ID",
		active:"Boolean",
		created:"StripeTimestamp",
		default_price:"StripePrice",
		description:"String",
		images:"String",
		livemode:"Boolean",
		metadata:"StripeAnyObject",
		name:"String",
		package_dimensions:"StripeDimensions",
		shippable:"Boolean",
		statement_descriptor:"String",
		tax_code:"String",
		unitLabel:"String",
		updated:"StripeTimestamp",
		url:"String",
		prices:"StripePrice"
	},
	StripeTimestamp: `scalar.StripeTimestamp` as const,
	StripeCustomUnitAmount:{
		maximum:"Int",
		minimum:"Int",
		preset:"Int"
	},
	StripeAnyObject: `scalar.StripeAnyObject` as const,
	StripePriceRecurring:{
		aggregate_usage:"StripeAggregateUsage",
		interval:"StripeInterval",
		interval_count:"Int",
		usage_type:"StripeUsageType",
		trial_period_days:"Int"
	},
	StripeTransformQuantity:{
		divideBy:"Int",
		round:"StripeRound"
	},
	StripePrice:{
		id:"ID",
		active:"Boolean",
		billing_scheme:"StripeBillingScheme",
		created:"StripeTimestamp",
		currency:"String",
		custom_unit_amount:"StripeCustomUnitAmount",
		livemode:"Boolean",
		lookup_key:"String",
		metadata:"StripeAnyObject",
		nickname:"String",
		product:"StripeProduct",
		recurring:"StripePriceRecurring",
		tax_behavior:"StripeTaxBehaviour",
		tiers_mode:"StripeTiersMode",
		transform_quantity:"StripeTransformQuantity",
		type:"StripeType",
		unit_amount:"Int",
		unit_amount_decimal:"String"
	},
	StripeProductsPage:{
		products:"StripeProduct",
		startingAfter:"ID",
		endingBefore:"ID"
	},
	Mutation:{
		webhook:"String",
		StripeMutation:"StripeMutation"
	},
	Query:{
		StripeQuery:"StripeQuery"
	}
}

export const Ops = {
mutation: "Mutation" as const,
	query: "Query" as const
}