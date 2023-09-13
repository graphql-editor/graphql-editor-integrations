import { ModelTypes } from '../zeus/index.js';

export type BookingRecordModel = Omit<ModelTypes['BookingRecord'], 'service'> & {
  service: string;
};
