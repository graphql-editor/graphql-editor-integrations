import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/utils.js';
import { MongoOrb } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'initStripeCustomer', async (args) => {
    const { email, name, phone, address } = args.initStripeCustomerInput;
    const existingCustomer = await MongoOrb('StripeCustomerCollection').collection.findOne({email: email});
    if(existingCustomer){
      await MongoOrb('UserCollection').collection.updateOne(
        { username: args.initStripeCustomerInput.email },
        { $set: { stripeId: existingCustomer.id } },
        { upsert: true },
      );
    }else{
      try {
        const stripe = newStripe();
        const customerInput: any = {};
        if(name){
          customerInput.name = name;
        }
        if(phone){
          customerInput.phone = phone;
        }
        if(address){
          customerInput.address = address
        }
        const customer = await stripe.customers.create(customerInput);
        
        await MongoOrb('UserCollection').collection.updateOne(
          { username: args.initStripeCustomerInput.email },
          { $set: { stripeId: customer.id } },
          { upsert: true },
        );
        return customer;
      } catch (error) {
        throw new Error('Failed to create Stripe customer.');
      }
    }
  })(input.arguments);
