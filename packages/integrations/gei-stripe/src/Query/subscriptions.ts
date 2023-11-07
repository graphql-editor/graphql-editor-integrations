import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb } from '../db/orm.js';
import { timestampMapping } from '../utils/customTypes/types.js';

export const subscriptions = async (input: FieldResolveInput) =>
  resolverFor('Query', 'subscriptions', async (args) => {
    let res;
    if (!args.filter) {
      res = await MongoOrb('StripeSubscriptionCollection').collection.find().toArray();
    } else {
      let filter: any = {};
      if (args.filter.id) filter.id = args.filter.id;
      if (args.filter.cancel_at_period_end !== undefined)
        filter.cancel_at_period_end = args.filter.cancel_at_period_end;
      if (args.filter.current_period_end) {
        filter.current_period_end = {};
        if (args.filter.current_period_end.Gt) filter.current_period_end.$gt = args.filter.current_period_end.Gt;
        if (args.filter.current_period_end.Gte) filter.current_period_end.$gte = args.filter.current_period_end.Gte;
        if (args.filter.current_period_end.Lt) filter.current_period_end.$lt = args.filter.current_period_end.Lt;
        if (args.filter.current_period_end.Lte) filter.current_period_end.$lte = args.filter.current_period_end.Lte;
      }
      if (args.filter.current_period_start) {
        filter.current_period_start = {};
        if (args.filter.current_period_start.Gt) filter.current_period_start.$gt = args.filter.current_period_start.Gt;
        if (args.filter.current_period_start.Gte)
          filter.current_period_start.$gte = args.filter.current_period_start.Gte;
        if (args.filter.current_period_start.Lt) filter.current_period_start.$lt = args.filter.current_period_start.Lt;
        if (args.filter.current_period_start.Lte)
          filter.current_period_start.$lte = args.filter.current_period_start.Lte;
      }

      if (args.filter.customer) filter.customer = args.filter.customer;
      if (args.filter.description) filter.description = args.filter.description;
      if (args.filter.quantity) filter.quantity = args.filter.quantity;
      if (args.filter.status) filter.status = args.filter.status;
      if (args.filter.items) filter.items.data.id = { $in: args.filter.items };
      return await MongoOrb('StripeSubscriptionCollection').collection.find(filter).toArray();
    }
    return res;
  })(input.arguments);
export default subscriptions;
