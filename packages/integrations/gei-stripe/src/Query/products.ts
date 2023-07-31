import { FieldResolveInput } from 'stucco-js';
import { resolverFor } from '../zeus/index.js';
import { MongoOrb } from "../db/orm.js";

export const handler = async (input: FieldResolveInput) => 
  resolverFor('Query','products',async (args) => {
    let res;
    if(!args || !args.filter){
      res = await MongoOrb('StripeProductCollection').collection.find().toArray();
    } else {
      let filter:any = {};
      if (args.filter.active !== undefined) filter.active = args.filter.active;
      if (args.filter.created) {
        filter.created = {};
        if (args.filter.created.Gt) filter.created.$gt = args.filter.created.Gt;
        if (args.filter.created.Gte) filter.created.$gte = args.filter.created.Gte;
        if (args.filter.created.Lt) filter.created.$lt = args.filter.created.Lt;
        if (args.filter.created.Lte) filter.created.$lte = args.filter.created.Lte;
      }
      if (args.filter.shippable !== undefined) filter.shippable = args.filter.shippable;
      if (args.filter.ids) filter.id = { $in: args.filter.ids };
      if (args.filter.url) filter.url = args.filter.url;

      res = await MongoOrb('StripeProductCollection').collection.find(filter).toArray();
    }
    return {products: res}
  })(input.arguments);
