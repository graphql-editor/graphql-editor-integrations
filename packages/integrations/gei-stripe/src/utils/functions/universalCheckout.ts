import { WithId } from "mongodb";
import Stripe from "stripe";
import { newStripe } from "../stripeInit";
import { MongoOrb } from "../../db/orm";
import { UserModel } from "../../models/UserModel";
import { product, applicationFee, item } from "../customTypes/types";

export const universalCheckout = async (successUrl: string, cancelUrl: string, products: product[], applicationFee: applicationFee | null | undefined, username: string | undefined | null) => {
    const stripe = newStripe();
    const subscriptionItems: item[] = [];
    const oneTimePaymentItems: item[] = [];
    let user: WithId<UserModel> | null = null;
    if(username){
        user = await MongoOrb('UserCollection').collection.findOne({ username });
        if (!user) {
          throw new Error('Invalid product or customer');
        }
    }
    let totalAmount = 0;
    await Promise.all(
      products.map(async (product) => {
        let price;
        if (product.productId.startsWith('price_')) {
          price = await MongoOrb('StripePriceCollection').collection.findOne({ id: product.productId });
          if(!price) throw new Error("Stripe price does not exist in database");
          if(price.billing_scheme == "tiered"){
            price = await stripe.prices.retrieve(product.productId, {
              expand: ['tiers']
            });
          }
        } else if (product.productId.startsWith('prod_')) {
          const foundProduct = await MongoOrb('StripeProductCollection').collection.findOne({ id: product.productId });
          if(!foundProduct) throw new Error("Stripe product does not exist in database ")
          if (!foundProduct.default_price) {
            throw new Error('Cannot find product ' + product.productId + ' default price');
          }
          price =
            typeof foundProduct.default_price === 'string'
              ? await MongoOrb('StripePriceCollection').collection.findOne({ id: foundProduct.default_price })
              : await MongoOrb('StripePriceCollection').collection.findOne({ id: foundProduct.default_price.id });
        } else {
          throw new Error('Invalid ID: ' + product.productId);
        }
        if(!price){
          throw new Error("Could not fetch price");
        }
        const quantity =
          price.type === 'recurring' || price.recurring?.usage_type === 'metered' ? 1 : product.quantity;
        const item = { price: price.id, ...(quantity && { quantity }) };
        if (price.type === 'recurring' && price.tiers) {
          totalAmount += calculateTieredPricing(price, quantity);
        } else {
          totalAmount += (price.unit_amount || 0) * (quantity || 0);
        }
        if (price.type === 'recurring') {
          subscriptionItems.push(item);
        } else {
          oneTimePaymentItems.push(item);
        }
      }),
    );
    const applicationFeeAmount = applicationFee ? Math.round((totalAmount * applicationFee.feePercentage) / 100) : 0;

    if (subscriptionItems.length > 0 && oneTimePaymentItems.length > 0) {
      throw new Error('Cannot handle subscription items and one-time payment items in the same request');
    }

    if (subscriptionItems.length > 0 || oneTimePaymentItems.length > 0) {
      const lineItems = subscriptionItems.length > 0 ? subscriptionItems : oneTimePaymentItems;
      const mode = subscriptionItems.length > 0 ? 'subscription' : 'payment';

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: lineItems,
        mode: mode,
        tax_id_collection: { enabled: true },
        automatic_tax: { enabled: true },
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        }
      };
      if(user?.stripeId){
        sessionData.customer = user.stripeId
      }
      if (applicationFeeAmount > 0 && applicationFee && oneTimePaymentItems.length > 0) {
        sessionData.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: applicationFee.connectAccountId,
          },
        };
        sessionData.invoice_creation = {
          enabled: true,
        };
      }

      if (applicationFeeAmount > 0 && applicationFee && subscriptionItems.length > 0) {
        sessionData.subscription_data = {
          application_fee_percent: applicationFee.feePercentage,
          transfer_data: {
            destination: applicationFee.connectAccountId,
          },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionData);
      return session.url;
    }
  };
  


  function calculateTieredPricing(price: Stripe.Response<Stripe.Price> | WithId<Stripe.Price>, quantity: number) {
    if (!price.tiers) return (price.unit_amount || 0) * quantity;
  
    let totalAmount = 0;
    let remainingQuantity = quantity;
    let previousTierEnd = 0; // This keeps track of the last tier's "up_to" value
  
    for (const tier of price.tiers) {
      const currentTierQuantity = tier.up_to
        ? Math.min(tier.up_to - previousTierEnd, remainingQuantity)
        : remainingQuantity;
  
      if (tier.flat_amount !== null) {
        totalAmount += tier.flat_amount * currentTierQuantity;
      } else if (tier.unit_amount) {
        totalAmount += tier.unit_amount * currentTierQuantity;
      }
  
      if (tier.up_to) {
        previousTierEnd = tier.up_to;
        remainingQuantity -= currentTierQuantity;
      }
  
      if (remainingQuantity <= 0) break;
    }
  
    return totalAmount;
  }
  