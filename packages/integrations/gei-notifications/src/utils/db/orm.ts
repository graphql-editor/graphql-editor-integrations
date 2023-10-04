import { iGraphQL } from 'i-graphql';
import { ObjectId } from 'mongodb';
import { Models } from '../../models/index.js';
import { GlobalError } from '../middleware.js';
import { collections } from './collections.js';

export const orm = async () => {
  return iGraphQL<
    {
      Notifications: Models['NotificationModel'];
      NotificationGroup: Models['NotificationGroupModel'];
      NotificationReaded: Models['NotificationReadedModel'];
    },
    {
      _id: () => string;
      createdAt: () => Date;
    }
  >({
    _id: () => new ObjectId().toHexString(),
    createdAt: () => new Date(),
  });
};

export const MongOrb = await orm();

export const mustFindOne = async (col: collections, filter: {}, options: {} | null = null) => {
  return orm().then((o) =>
    o(col)
      .collection.findOne(filter, options ? options : {})
      .catch(() => {
        throw new GlobalError('mustFindOne returns null', import.meta.url);
      }),
  );
};

export const mustFindAny = async (col: collections, filter: {} | null = null, options: {} | null = null) => {
  return await orm().then((o) =>
    o(col)
      .collection.find(filter ? filter : {}, options ? options : {})
      .toArray()
      .catch(() => {
        throw new GlobalError('mustFindOne returns null', import.meta.url);
      }),
  );
};

export type PageOptions = {
  limit: number;
  page: number;
  skip: number;
};

export const preparePageOptions = (page?: { limit?: number | null; page?: number | null } | null): PageOptions => {
  const lim = page?.limit || 10;
  const sk = page?.page || 0;
  return {
    limit: lim,
    page: sk,
    skip: lim * sk,
  };
};

type preparedDate = {
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
};

export const prepareDateOptions = (sd: unknown, ed: unknown): preparedDate => {
  const endDate = () => {
    if (typeof ed === 'string' && Date.parse(ed) >= 0) {
      return new Date(ed);
    }
    return undefined;
  };
  const startDate = () => {
    if (typeof sd === 'string' && Date.parse(sd) >= 0) {
      return new Date(sd);
    }
    return undefined;
  };
  if (typeof startDate() === 'undefined' && typeof endDate() === 'undefined') {
    return {};
  }
  return {
    createdAt: {
      ...(startDate() && { $gte: startDate() }),
      ...(endDate() && { $lte: endDate() }),
    },
  };
};
