import Stripe from 'stripe';

export type ExternalAccount = Stripe.BankAccount | Stripe.Card;

export type item = {
  price: string;
  quantity?: number;
};

export type product = {
  productId: string;
  quantity: number;
};

export type applicationFee = {
  feePercentage: number;
  connectAccountId: string;
};
