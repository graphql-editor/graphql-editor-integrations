
import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils.js';


export const handler = async (input: FieldResolveInput) => 
  resolverFor('Mutation','initStripeCustomer',async (args) => {
    console.log("ema")
    throw new Error("siema")
    /*
    return true;
    const { email, name, phone, address } = args.initStripeCustomerInput;
    const stripe = newStripe();
    try {
      const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined
      });
  
      return customer;
    } catch (error) {
      throw new Error('Failed to create Stripe customer.');
    }
    */
  })(input.arguments);


  