import { ModelTypes } from '../zeus/index.js';
    
export type ServiceModel = Omit< ModelTypes['Service'], "createdAt"> & {
    createdAt: Date
};