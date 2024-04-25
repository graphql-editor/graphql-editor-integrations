import { FieldResolveInput } from 'stucco-js';
import { BookStatus, resolverFor } from '../zeus/index.js';
import { MongoOrb, updateNestedFields } from '../utils/db/orm.js';
import { GlobalError, errMiddleware, sourceContainUserIdOrThrow } from '../utils/middleware.js';
import { ObjectId, WithId } from 'mongodb';
import { ServiceModel } from '../models/ServiceModel.js';

export const updateBooking = async (input: FieldResolveInput) =>
  resolverFor('UserMutation', 'updateBooking', async (args, src) =>
      errMiddleware(async () => {
        sourceContainUserIdOrThrow(src);
        if (args.input.addServiceIds){
            const bookServices = await Promise.all(
              args.input.addServiceIds?.map(
                async (serviceId) =>
                  (
                    await MongoOrb('Services').collection.findOneAndUpdate(
                      { _id: serviceId, taken: { $ne: true } },
                      { $set: { taken: true } },
                    )
                  ).value || serviceId,
              ),
            );
            if(!bookServices[0]) throw new GlobalError(`Services with _ids: ${args.input.removeServiceIds} is not find`, import.meta.url);
            const [bookedServices, busy] = [
              bookServices?.filter((s): s is ServiceModel => typeof s !== 'string'),
              bookServices?.filter((s): s is string => typeof s === 'string'),
            ];
          
    
            if (busy[0]) {
              if(bookedServices[0]){
              await MongoOrb('Services').collection.updateMany(
                { _id: { $in: bookedServices.map((s) => s._id) } },
                { $set: { taken: false } },
              );
            }
              throw new GlobalError(`Service is already taken: ${busy}`, import.meta.url);
            }
          }
          if (args.input.removeServiceIds){
            const unlockServices = await Promise.all(
              args.input.removeServiceIds.map(
                async (serviceId) =>
                  (
                    await MongoOrb('Services').collection.findOneAndUpdate(
                      { _id: serviceId, taken: { $ne: false } },
                      { $set: { taken: false } },
                    )
                  ).value || serviceId,
              ),
            );
            if(!unlockServices[0]) throw new GlobalError(`Services with _ids: ${args.input.removeServiceIds} is not find`, import.meta.url);
            const [unlockedServices, alreadyFree] = [
              unlockServices.filter((s): s is ServiceModel => typeof s !== 'string'),
              unlockServices.filter((s): s is string => typeof s === 'string'),
            ];
    
            if (alreadyFree[0] ) {
              if(unlockedServices[0]){
              await MongoOrb('Services').collection.updateMany(
                { _id: { $in: unlockedServices.map((s) => s._id) } },
                { $set: { taken: true } },
              );
              }
              throw new GlobalError(`Service is not booked: ${alreadyFree}`, import.meta.url);
            }
          }
          
            const comments = args.input.comments ? updateNestedFields( args.input.comments, 'comments') : undefined
      
            const update = await MongoOrb('Bookings').collection.findOneAndUpdate(
              { _id: args.input._id },
              {
                $set: { ...comments },
               ...(args.input.addServiceIds && { $push: { services: { $each: args.input.addServiceIds }}}),
                ...(args.input.removeServiceIds && {$pull: { services: { $each: args.input.removeServiceIds } }}),
              },
            );
          
            if (!update.ok) throw new GlobalError(`Nothing has been changed here`, import.meta.url);
            return { book: update.value };
          }))(input.arguments, input.source);
      export default updateBooking;