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

export const timestampMapping: { [key: string]: string } = {
  'Gt': '$gt',
  'Gte': '$gte',
  'Lt': '$lt',
  'Lte': '$lte'
};
