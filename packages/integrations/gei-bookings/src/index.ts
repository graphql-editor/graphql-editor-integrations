import { NewIntegration } from 'graphql-editor-cli';
import QueryUser from './Query/user.js';
import QueryPublic from './Query/public.js';
import MutationUser from './Mutation/user.js';
import PublicQueryListServices from './PublicQuery/listServices.js';
import PublicQueryGetService from './PublicQuery/getService.js';
import UserMutationRegisterService from './UserMutation/registerService.js';
import UserMutationUpdateService from './UserMutation/updateService.js';
import UserQueryGetSelfBooks from './UserQuery/getSelfBooks.js';
import UserMutationBookService from './UserMutation/bookService.js';
import UserMutationUpdateBooking from './UserMutation/updateBooking.js';
import UserMutationRemoveBooking from './UserMutation/removeBooking.js';
import UserMutationRespondOnServiceRequest from './UserMutation/respondOnServiceRequest.js';
import UserQueryGetBookingsForService from './UserQuery/getBookingsForService.js';
import UserMutationRemoveService from './UserMutation/removeService.js';
import UserQueryGetSelfServices from './UserQuery/getSelfServices.js';

export const integration = NewIntegration({
  Query: {
    user: {
      name: 'user',
      description: 'Pipeline to user queries',
      handler: QueryUser,
    },
    public: {
      name: 'public',
      description: 'Pipeline to queries, without tracking and required logged user',
      handler: QueryPublic,
    },
  },
  Mutation: {
    user: {
      name: 'user',
      description: 'Pipeline to user mutations',
      handler: MutationUser,
    },
  },
  PublicQuery: {
    listServices: {
      name: 'listServices',
      description: 'List available services',
      handler: PublicQueryListServices,
    },
    getService: {
      name: 'getService',
      description: 'Get single specific service',
      handler: PublicQueryGetService,
    },
  },
  UserMutation: {
    registerService: {
      name: 'registerService',
      description: 'Register a new service',
      handler: UserMutationRegisterService,
    },
    updateService: {
      name: 'updateService',
      description: 'Update service information',
      handler: UserMutationUpdateService,
    },
    bookService: {
      name: 'bookService',
      description: 'Book a service',
      handler: UserMutationBookService,
    },
    updateBooking: {
      name: 'bookService',
      description: 'update a booking',
      handler: UserMutationUpdateBooking,
    },
    removeBooking: {
      name: 'removeBooking',
      description: 'Remove a booking',
      handler: UserMutationRemoveBooking,
    },
    respondOnServiceRequest: {
      name: 'respondOnServiceRequest',
      description: 'Respond to a service request',
      handler: UserMutationRespondOnServiceRequest,
    },
    removeService: {
      name: 'removeService',
      description: 'Remove a service',
      handler: UserMutationRemoveService,
    },
  },
  UserQuery: {
    getSelfBooks: {
      name: 'getSelfBooks',
      description: 'Get books associated with the user',
      handler: UserQueryGetSelfBooks,
    },
    getBookingsForService: {
      name: 'getBookingsForService',
      description: 'Get bookings for a specific service',
      handler: UserQueryGetBookingsForService,
    },
    getSelfServices: {
      name: 'getSelfServices',
      description: 'Get services associated with the user',
      handler: UserQueryGetSelfServices,
    },
  },
});

export default integration;
