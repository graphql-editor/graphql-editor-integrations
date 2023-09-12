
## How to use

Add to stucco.json
```
    "azureOpts": {
        "webhooks": [
            "webhook/Mutation/webhook"
        ]
    }
```

Here is how webhook looks in graphql
```
type Mutation{
	webhook: String
}
```

### On the server

Define webhook endpoint with link to your deployed backend, for example
`yourbackend.com/webhook/mutation/webhook`
https://dashboard.stripe.com/test/webhooks


### Locally

To test endpoint locally wihtout defining webhook endpoint use commands below
```
stripe login
stripe listen --forward-to localhost:8080/webhook/mutation/webhook  
stripe trigger payment_intent.succeeded
```




## Used webhook events

```
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
product.created
product.updated
product.deleted
price.created
price.updated
price.deleted
checkout.session.completed
payment_intent.processing
payment_intent.canceled
payment_intent.succeeded
payment_intent.payment_failed
tax_rate.created
tax_rate.updated
invoice.paid
invoice.payment_succeeded
invoice.payment_failed
invoice.upcoming
invoice.marked_uncollectible
invoice.payment_action_required
customer.created
customer.deleted
customer.updated
customer.default_source_updated
account.external_account.created
account.external_account.deleted
account.external_account.updated
payment_method.attached
payment_method.detached
payment_method.updated
```



