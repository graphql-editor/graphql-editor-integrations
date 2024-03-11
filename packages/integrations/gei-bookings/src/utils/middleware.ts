export class GlobalError extends Error {
  constructor(public message: string, public path: string) {
    super(message);
  }
}

export const errMiddleware = async <T>(handler: () => Promise<T>): Promise<T | { response: { error: unknown } }> => {
  try {
    return await handler();
  } catch (e) {
    if (e instanceof GlobalError) {
      return {
        response: {
          error: {
            message: e.message,
            path: e.path,
          },
        },
      };
    }
    return { response: { error: { message: `unknown error: ${e}` } } };
  }
};

export const typeGuard = <T extends object>(source: Record<string, any>, key: keyof T): source is T => key in source;

export const sourceContainUserIdOrThrow = (source: any) => {
  if ((!typeGuard<SourceWithUserId>(source, 'userId') || typeof source.userId !== 'string') && typeof source._id !== 'string') {
    throw new GlobalError('input source is malformed', import.meta.url);
  }
};

export type SourceWithUserId = {
  userId: string;
};

type ConvertDates = { createdAt?: Date; startDate?: Date, updatedAt?: Date }
export const convertDateObjToStringForArray = <T extends ConvertDates>(arr: T[]) => arr.map((obj) => convertDatedObjToString<T>(obj));
export const convertDatedObjToString = <T extends ConvertDates>(obj: T | null) => ({
  ...obj,
  createdAt: obj?.createdAt?.toISOString() || null,
  updatedAt: obj?.updatedAt?.toISOString() || null,
  startDate: obj?.startDate?.toISOString() || null,
});