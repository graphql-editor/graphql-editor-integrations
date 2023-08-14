import Stripe from "stripe";

export type ExternalAccount = Stripe.BankAccount | Stripe.Card;