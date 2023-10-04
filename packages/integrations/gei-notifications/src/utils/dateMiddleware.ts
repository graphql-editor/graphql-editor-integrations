import { ModelTypes, ResolverInputTypes } from '../zeus';

const toDate = (value: unknown): Date | undefined | null => {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  throw new Error('Invalid date');
};

export const mapDates = <T extends object, K extends keyof T>(obj: T, ...dateFields: K[]) =>
  Object.entries(obj)
    .map(([k, v]) => [k, dateFields.includes(k as K) ? toDate(v) : v])
    .reduce(
      (pv, [kv, cv]) => ({
        ...pv,
        [kv as K]: cv,
      }),
      {},
    ) as Omit<T, K> & Record<K, Date | undefined | null>;

interface MapFn<T, R> {
  (v: T): R;
}

export const dateMiddleware = <T, R>(
  map: MapFn<T, R>,
  cb: (typedArg: R, source: unknown) => unknown,
): ((arg: T, source: unknown) => unknown) => {
  return (arg: T, source: unknown): unknown => cb(map(arg), source);
};
