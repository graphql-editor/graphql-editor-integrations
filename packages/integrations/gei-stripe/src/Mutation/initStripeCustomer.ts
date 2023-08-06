import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { newStripe } from '../utils/utils.js';
import { MongoOrb } from '../db/orm.js';

export const handler = async (input: FieldResolveInput) =>
  resolverFor('Mutation', 'initStripeCustomer', async (args) => {
    console.log("SS")
    const { email, name, phone, address } = args.initStripeCustomerInput;
    console.log(args.initStripeCustomerInput)
    const existingCustomer = await MongoOrb('StripeCustomerCollection').collection.findOne({email: email});
    console.log(existingCustomer)
    if(existingCustomer){
      console.log("existing customer")
      await MongoOrb('UserCollection').collection.updateOne(
        { username: args.initStripeCustomerInput.email },
        { $set: { stripeId: existingCustomer.id } },
        { upsert: true },
      );
      return true;
    }else{
      console.log("SDD" + " " + process.env.STRIPE_KEY)
      // Init customer with 'auto' data to allow further tax collection during payment
      const stripe = newStripe();
      const customerInput: any = {};
      customerInput.name = (name ? name : 'auto' )
      customerInput.address = (address ? address : 'auto')
      customerInput.email = email
      if(phone){
        customerInput.phone = phone;
      }
      console.log(customerInput)
      const customer = await stripe.customers.create({email: "ughakai@gmail.com"});
      console.log(customer)
      const res = await MongoOrb('UserCollection').collection.updateOne(
        { username: args.initStripeCustomerInput.email },
        { $set: { stripeId: customer.id } },
        { upsert: true },
      );
      return res.modifiedCount === 1
    }
  })(input.arguments);
