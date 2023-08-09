import { FieldResolveInput } from 'stucco-js';
import { prepareModel, prepare_id, prepareSourceParameters, prepareRelatedField, prepareRelatedModel } from '../data.js';
import { DB } from '../db/mongo.js';

export const handler = async (input: FieldResolveInput) =>
  DB().then(async (db) => {
    const _id = prepare_id(input) || prepareSourceParameters(input)._id;
    if (!_id) throw new Error('_id not found');

    const object = await db
    .collection(prepareModel(input))
    .findOne({ _id })
    if (!object) {
      throw new Error(
        'Object with this _id not found',
      );
    }
    const res = await db
      .collection(prepareModel(input))
      .deleteOne({ _id, ...prepareSourceParameters(input) })
    if(!res.deletedCount) throw new Error(`Object not found. Please check parameters: ${JSON.stringify({ _id, ...prepareSourceParameters(input) })}`)

    const s = object as Record<string, any>;
    const prepareField = prepareRelatedField(input)?.replace(/[{ }]/g, '')?.split(":");
    if(prepareField ){
    const fieldForFounding = prepareField[0];
    
    const fieldWithArray = prepareField[1] ? prepareField[1]  : undefined

    if(!fieldWithArray){
       db.collection(prepareRelatedModel(input)).updateMany(
        {},
        { $pull: { [fieldForFounding]:  s._id  } }
      );
      return !!res.deletedCount
    }
    if(fieldWithArray&&!s[fieldWithArray]?.length) !!res.deletedCount

     db.collection(prepareRelatedModel(input))
      .deleteMany( { [fieldForFounding]: { $in: s[fieldWithArray]}
        })
      }
    return !!res.deletedCount
  });
