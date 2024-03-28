import { ModelTypes } from '../zeus/index.js';

export type BookingRecordModel = Omit<ModelTypes['BookingRecord'], 'services'> & {
  services: string[];
};
