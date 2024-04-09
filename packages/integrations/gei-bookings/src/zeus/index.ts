/* eslint-disable */


import { AllTypesProps, ReturnTypes, Ops } from './const.js';
import fetch, { Response } from 'node-fetch';
import WebSocket from 'ws';
export const HOST = "http://localhost:8080/"


export const HEADERS = {}
export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
};
const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};

export const apiFetch =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const fetchOptions = options[1] || {};
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
  scalars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions;
  scalars?: ScalarDefinition;
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
    vars: Array<{ name: string; graphQLType: string }> = [],
  ): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt({
        props,
        returns,
        ops,
        scalars,
        vars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false, vars);
        })
        .join('\n');
    }
    const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
    const keyForDirectives = o.__directives ?? '';
    const query = `{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars))
      .join('\n')}}`;
    if (!root) {
      return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
    }
    const varsString = vars.map((v) => `${v.name}: ${v.graphQLType}`).join(', ');
    return `${k} ${keyForDirectives}${hasOperationName}${varsString ? `(${varsString})` : ''} ${query}`;
  };
  return ibb;
};

export const Thunder =
  (fn: FetchFunction) =>
  <O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(o: Z | ValueTypes[R], ops?: OperationOptions & { variables?: Record<string, unknown> }) =>
    fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
      ops?.variables,
    ).then((data) => {
      if (graphqlOptions?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: operation,
          initialZeusQuery: o as VType,
          returns: ReturnTypes,
          scalars: graphqlOptions.scalars,
          ops: Ops,
        });
      }
      return data;
    }) as Promise<InputType<GraphQLTypes[R], Z, SCLR>>;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  (fn: SubscriptionFunction) =>
  <O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(o: Z | ValueTypes[R], ops?: OperationOptions & { variables?: ExtractVariables<Z> }) => {
    const returnedFunction = fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], SCLR>;
    if (returnedFunction?.on && graphqlOptions?.scalars) {
      const wrapped = returnedFunction.on;
      returnedFunction.on = (fnToCall: (args: InputType<GraphQLTypes[R], Z, SCLR>) => void) =>
        wrapped((data: InputType<GraphQLTypes[R], Z, SCLR>) => {
          if (graphqlOptions?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: operation,
                initialZeusQuery: o as VType,
                returns: ReturnTypes,
                scalars: graphqlOptions.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
  };

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: Z | ValueTypes[R],
  ops?: {
    operationOptions?: OperationOptions;
    scalars?: ScalarDefinition;
  },
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops?.operationOptions,
    scalars: ops?.scalars,
  })(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
  headers: {
    'Content-Type': 'application/json',
    ...HEADERS,
  },
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

export const decodeScalarsInResponse = <O extends Operations>({
  response,
  scalars,
  returns,
  ops,
  initialZeusQuery,
  initialOp,
}: {
  ops: O;
  response: any;
  returns: ReturnTypesType;
  scalars?: Record<string, ScalarResolver | undefined>;
  initialOp: keyof O;
  initialZeusQuery: InputValueType | VType;
}) => {
  if (!scalars) {
    return response;
  }
  const builder = PrepareScalarPaths({
    ops,
    returns,
  });

  const scalarPaths = builder(initialOp as string, ops[initialOp], initialZeusQuery);
  if (scalarPaths) {
    const r = traverseResponse({ scalarPaths, resolvers: scalars })(initialOp as string, response, [ops[initialOp]]);
    return r;
  }
  return response;
};

export const traverseResponse = ({
  resolvers,
  scalarPaths,
}: {
  scalarPaths: { [x: string]: `scalar.${string}` };
  resolvers: {
    [x: string]: ScalarResolver | undefined;
  };
}) => {
  const ibb = (k: string, o: InputValueType | VType, p: string[] = []): unknown => {
    if (Array.isArray(o)) {
      return o.map((eachO) => ibb(k, eachO, p));
    }
    if (o == null) {
      return o;
    }
    const scalarPathString = p.join(SEPARATOR);
    const currentScalarString = scalarPaths[scalarPathString];
    if (currentScalarString) {
      const currentDecoder = resolvers[currentScalarString.split('.')[1]]?.decode;
      if (currentDecoder) {
        return currentDecoder(o);
      }
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string' || !o) {
      return o;
    }
    const entries = Object.entries(o).map(([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const);
    const objectFromEntries = entries.reduce<Record<string, unknown>>((a, [k, v]) => {
      a[k] = v;
      return a;
    }, {});
    return objectFromEntries;
  };
  return ibb;
};

export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | `scalar.${string}`
    | 'enum'
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | `scalar.${string}`
    | undefined;
};
export type InputValueType = {
  [x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, unknown>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions = {
  operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
  scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (mappedParts: string[], returns: ReturnTypesType): `scalar.${string}` | undefined => {
  if (mappedParts.length === 0) {
    return;
  }
  const oKey = mappedParts[0];
  const returnP1 = returns[oKey];
  if (typeof returnP1 === 'object') {
    const returnP2 = returnP1[mappedParts[1]];
    if (returnP2) {
      return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
    }
    return undefined;
  }
  return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({ ops, returns }: { returns: ReturnTypesType; ops: Operations }) => {
  const ibb = (
    k: string,
    originalKey: string,
    o: InputValueType | VType,
    p: string[] = [],
    pOriginals: string[] = [],
    root = true,
  ): { [x: string]: `scalar.${string}` } | undefined => {
    if (!o) {
      return;
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
      const extractionArray = [...pOriginals, originalKey];
      const isScalar = ExtractScalar(extractionArray, returns);
      if (isScalar?.startsWith('scalar')) {
        const partOfTree = {
          [[...p, k].join(SEPARATOR)]: isScalar,
        };
        return partOfTree;
      }
      return {};
    }
    if (Array.isArray(o)) {
      return ibb(k, k, o[1], p, pOriginals, false);
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(alias, operationName, operation, p, pOriginals, false);
        })
        .reduce((a, b) => ({
          ...a,
          ...b,
        }));
    }
    const keyName = root ? ops[k] : k;
    return Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map(([k, v]) => {
        // Inline fragments shouldn't be added to the path as they aren't a field
        const isInlineFragment = originalKey.match(/^...\s*on/) != null;
        return ibb(
          k,
          k,
          v,
          isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
          isInlineFragment ? pOriginals : [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        );
      })
      .reduce((a, b) => ({
        ...a,
        ...b,
      }));
  };
  return ibb;
};

export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (propsP1 === 'enum' && mappedParts.length === 1) {
      return 'enum';
    }
    if (typeof propsP1 === 'string' && propsP1.startsWith('scalar.') && mappedParts.length === 1) {
      return propsP1;
    }
    if (typeof propsP1 === 'object') {
      if (mappedParts.length < 2) {
        return 'not';
      }
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        if (mappedParts.length < 3) {
          return 'not';
        }
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    if (mappedParts.length === 0) {
      return 'not';
    }
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      if (mappedParts.length < 2) return 'not';
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = ({
  props,
  ops,
  returns,
  scalars,
  vars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  scalars?: ScalarDefinition;
  vars: Array<{ name: string; graphQLType: string }>;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (typeof a === 'string') {
      if (a.startsWith(START_VAR_NAME)) {
        const [varName, graphQLType] = a.replace(START_VAR_NAME, '$').split(GRAPHQL_TYPE_SEPARATOR);
        const v = vars.find((v) => v.name === varName);
        if (!v) {
          vars.push({
            name: varName,
            graphQLType,
          });
        } else {
          if (v.graphQLType !== graphQLType) {
            throw new Error(
              `Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
            );
          }
        }
        return varName;
      }
    }
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};

export const resolverFor = <X, T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]>(
  type: T,
  field: Z,
  fn: (
    args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : never,
) => fn as (args?: any, source?: any) => ReturnType<typeof fn>;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
  T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & { name: infer T }
  ? T extends keyof SCLR
    ? SCLR[T]['decode'] extends (s: unknown) => unknown
      ? ReturnType<SCLR[T]['decode']>
      : unknown
    : unknown
  : S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
  ? InputType<R, U, SCLR>[]
  : InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<SRC extends DeepAnify<DST>, DST, SCLR extends ScalarDefinition> = FlattenArray<SRC> extends
  | ZEUS_INTERFACES
  | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P], SCLR>
          : IsArray<R, '__typename' extends keyof DST ? { __typename: true } : never, SCLR>
        : never;
    }[keyof SRC] & {
      [P in keyof Omit<
        Pick<
          SRC,
          {
            [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
          }[keyof DST]
        >,
        '__typename'
      >]: IsPayLoad<DST[P]> extends BaseZeusResolver ? IsScalar<SRC[P], SCLR> : IsArray<SRC[P], DST[P], SCLR>;
    }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    };

export type MapType<SRC, DST, SCLR extends ScalarDefinition> = SRC extends DeepAnify<DST>
  ? IsInterfaced<SRC, DST, SCLR>
  : never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<SRC, DST, SCLR extends ScalarDefinition = {}> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
    } & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
  : MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
  off: (fn: (e: { data?: InputType<T, Z, SCLR>; code?: number; reason?: string; message?: string }) => void) => void;
  error: (fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void) => void;
  open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<SELECTOR, NAME extends keyof GraphQLTypes, SCLR extends ScalarDefinition = {}> = InputType<
  GraphQLTypes[NAME],
  SELECTOR,
  SCLR
>;

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <T>(t: T | V) => T;

type BuiltInVariableTypes = {
  ['String']: string;
  ['Int']: number;
  ['Float']: number;
  ['ID']: unknown;
  ['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> = `${T}!` | T | `[${T}]` | `[${T}]!` | `[${T}!]` | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
  ? R1 extends VR<infer R2>
    ? R2 extends VR<infer R3>
      ? R3 extends VR<infer R4>
        ? R4 extends VR<infer R5>
          ? R5
          : R4
        : R3
      : R2
    : R1
  : T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
  ? Array<DecomposeType<R, Type>> | undefined
  : T extends `${infer R}!`
  ? NonNullable<DecomposeType<R, Type>>
  : Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> = T extends keyof ZEUS_VARIABLES
  ? ZEUS_VARIABLES[T]
  : T extends keyof BuiltInVariableTypes
  ? BuiltInVariableTypes[T]
  : any;

export type GetVariableType<T extends string> = DecomposeType<
  T,
  ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
  [K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> & WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
  ' __zeus_name': Name;
  ' __zeus_type': T;
};

export type ExtractVariables<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends [infer Inputs, infer Outputs]
  ? ExtractVariables<Inputs> & ExtractVariables<Outputs>
  : Query extends string | number | boolean
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>> }[keyof Query]>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(name: Name, graphqlType: Type) => {
  return (START_VAR_NAME + name + GRAPHQL_TYPE_SEPARATOR + graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = GraphQLTypes["dbEssentials"]
export type ScalarCoders = {
	Date?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["Query"]: AliasType<{
	/** if used user query endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserQuery will throw error about malformed source */
	user?:ValueTypes["UserQuery"],
	public?:ValueTypes["PublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UserQuery"]: AliasType<{
getSelfBooks?: [{	input?: ValueTypes["GetBooksInput"] | undefined | null | Variable<any, string>},ValueTypes["GetBooksRepsond"]],
getBookingsForService?: [{	input?: ValueTypes["GetBookingsForServiceInput"] | undefined | null | Variable<any, string>},ValueTypes["GetBookingsForServiceRespond"]],
getSelfServices?: [{	input?: ValueTypes["GetSelfServicesInput"] | undefined | null | Variable<any, string>},ValueTypes["GetSelfServicesRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	/** if used user mutation endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserMutation will throw error about malformed source */
	user?:ValueTypes["UserMutation"],
		__typename?: boolean | `@${string}`
}>;
	["PublicQuery"]: AliasType<{
listServices?: [{	input?: ValueTypes["ListServicesInput"] | undefined | null | Variable<any, string>},ValueTypes["ListServicesRespond"]],
getService?: [{	serviceId: string | Variable<any, string>},ValueTypes["GetServiceRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["UserMutation"]: AliasType<{
registerService?: [{	input: ValueTypes["RegisterServiceInput"] | Variable<any, string>},ValueTypes["RegisterServiceRespond"]],
updateService?: [{	input: Array<ValueTypes["UpdateServiceInput"]> | Variable<any, string>},ValueTypes["UpdateServiceRespond"]],
removeService?: [{	serviceId: string | Variable<any, string>},ValueTypes["RemoveServiceRespond"]],
bookService?: [{	input: ValueTypes["BookServiceInput"] | Variable<any, string>},ValueTypes["BookServiceRespond"]],
send?: [{	mailgunData: ValueTypes["MailgunData"] | Variable<any, string>},boolean | `@${string}`],
respondOnServiceRequest?: [{	input: ValueTypes["RespondOnServiceRequestInput"] | Variable<any, string>},ValueTypes["RespondOnServiceRequestRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["MailgunData"]: {
	to: string | Variable<any, string>,
	subject: string | Variable<any, string>,
	message: string | Variable<any, string>,
	from?: string | undefined | null | Variable<any, string>
};
	["GetBookingsForServiceInput"]: {
	page?: ValueTypes["PageOptionsInput"] | undefined | null | Variable<any, string>,
	filters?: ValueTypes["GetBookingsForServiceFiltersInput"] | undefined | null | Variable<any, string>
};
	["GetBookingsForServiceFiltersInput"]: {
	fromDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	toDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	bookerId?: string | undefined | null | Variable<any, string>,
	status?: ValueTypes["BookStatus"] | undefined | null | Variable<any, string>
};
	["GetBookingsForServiceRespond"]: AliasType<{
	books?:ValueTypes["BookingRecord"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RespondOnServiceRequestInput"]: {
	bookIds: Array<string> | Variable<any, string>,
	/** answer field cannot be PENDING, otherwise it will throw error */
	answer: ValueTypes["BookStatus"] | Variable<any, string>
};
	["GetSelfServicesInput"]: {
	page?: ValueTypes["PageOptionsInput"] | undefined | null | Variable<any, string>,
	filters?: ValueTypes["GetSelfServicesFiltersInput"] | undefined | null | Variable<any, string>
};
	["GetSelfServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined | null | Variable<any, string>,
	/** description is regex */
	description?: string | undefined | null | Variable<any, string>,
	fromDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	toDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>
};
	["GetSelfServicesRespond"]: AliasType<{
	service?:ValueTypes["Service"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RespondOnServiceRequestRespond"]: AliasType<{
	status?:boolean | `@${string}`,
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["GetBooksInput"]: {
	page?: ValueTypes["PageOptionsInput"] | undefined | null | Variable<any, string>,
	filters?: ValueTypes["GetBooksFiltersInput"] | undefined | null | Variable<any, string>
};
	["GetBooksFiltersInput"]: {
	startDate: string | Variable<any, string>
};
	["ListServicesInput"]: {
	page?: ValueTypes["PageOptionsInput"] | undefined | null | Variable<any, string>,
	filters?: ValueTypes["ListServicesFiltersInput"] | undefined | null | Variable<any, string>
};
	["GetBooksRepsond"]: AliasType<{
	books?:ValueTypes["BookingRecord"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["ListServicesRespond"]: AliasType<{
	services?:ValueTypes["Service"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["GetServiceRespond"]: AliasType<{
	service?:ValueTypes["Service"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RegisterUserInput"]: {
	username: string | Variable<any, string>,
	email: string | Variable<any, string>,
	phone?: string | undefined | null | Variable<any, string>
};
	["RegisterServiceInput"]: {
	name: string | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	startDates: Array<ValueTypes["Date"]> | Variable<any, string>,
	time?: number | undefined | null | Variable<any, string>,
	neededAccept?: boolean | undefined | null | Variable<any, string>,
	active?: boolean | undefined | null | Variable<any, string>
};
	["RegisterServiceRespond"]: AliasType<{
	service?:ValueTypes["Service"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["UpdateServiceInput"]: {
	serviceId: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	startDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	time?: number | undefined | null | Variable<any, string>,
	active?: boolean | undefined | null | Variable<any, string>,
	neededAccept?: boolean | undefined | null | Variable<any, string>
};
	["UpdateServiceRespond"]: AliasType<{
	service?:ValueTypes["Service"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RemoveServiceRespond"]: AliasType<{
	removed?:boolean | `@${string}`,
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RemoveBookingRespond"]: AliasType<{
	removed?:boolean | `@${string}`,
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookServiceInput"]: {
	serviceIds: Array<string> | Variable<any, string>,
	comments?: string | undefined | null | Variable<any, string>
};
	["BookServiceRespond"]: AliasType<{
	book?:ValueTypes["BookingRecord"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["UserServiceRespond"]: AliasType<{
	service?:ValueTypes["Service"],
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["Service"]: AliasType<{
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	ownerId?:boolean | `@${string}`,
	/** this field capture time, system does not recognize units, so be consent with your behavior */
	time?:boolean | `@${string}`,
	startDate?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	taken?:boolean | `@${string}`,
	neededAccept?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BookingRecord"]: AliasType<{
	bookerId?:boolean | `@${string}`,
	services?:ValueTypes["Service"],
	comments?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	answeredAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GlobalError"]: AliasType<{
	/** custom message of error */
	message?:boolean | `@${string}`,
	/** path is name of resolver on which we got error */
	path?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["dbEssentials"]:AliasType<{
		_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`;
		['...on Service']?: Omit<ValueTypes["Service"],keyof ValueTypes["dbEssentials"]>;
		['...on BookingRecord']?: Omit<ValueTypes["BookingRecord"],keyof ValueTypes["dbEssentials"]>;
		__typename?: boolean | `@${string}`
}>;
	["PageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined | null | Variable<any, string>,
	/** count stating from 0 */
	page?: number | undefined | null | Variable<any, string>
};
	["ListServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined | null | Variable<any, string>,
	/** description is regex */
	description?: string | undefined | null | Variable<any, string>,
	fromDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	toDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	ownerId?: string | undefined | null | Variable<any, string>
};
	["Date"]:unknown;
	["BookStatus"]:BookStatus;
	["ServiceType"]:ServiceType
  }

export type ResolverInputTypes = {
    ["Query"]: AliasType<{
	/** if used user query endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserQuery will throw error about malformed source */
	user?:ResolverInputTypes["UserQuery"],
	public?:ResolverInputTypes["PublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UserQuery"]: AliasType<{
getSelfBooks?: [{	input?: ResolverInputTypes["GetBooksInput"] | undefined | null},ResolverInputTypes["GetBooksRepsond"]],
getBookingsForService?: [{	input?: ResolverInputTypes["GetBookingsForServiceInput"] | undefined | null},ResolverInputTypes["GetBookingsForServiceRespond"]],
getSelfServices?: [{	input?: ResolverInputTypes["GetSelfServicesInput"] | undefined | null},ResolverInputTypes["GetSelfServicesRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	/** if used user mutation endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserMutation will throw error about malformed source */
	user?:ResolverInputTypes["UserMutation"],
		__typename?: boolean | `@${string}`
}>;
	["PublicQuery"]: AliasType<{
listServices?: [{	input?: ResolverInputTypes["ListServicesInput"] | undefined | null},ResolverInputTypes["ListServicesRespond"]],
getService?: [{	serviceId: string},ResolverInputTypes["GetServiceRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["UserMutation"]: AliasType<{
registerService?: [{	input: ResolverInputTypes["RegisterServiceInput"]},ResolverInputTypes["RegisterServiceRespond"]],
updateService?: [{	input: Array<ResolverInputTypes["UpdateServiceInput"]>},ResolverInputTypes["UpdateServiceRespond"]],
removeService?: [{	serviceId: string},ResolverInputTypes["RemoveServiceRespond"]],
bookService?: [{	input: ResolverInputTypes["BookServiceInput"]},ResolverInputTypes["BookServiceRespond"]],
send?: [{	mailgunData: ResolverInputTypes["MailgunData"]},boolean | `@${string}`],
respondOnServiceRequest?: [{	input: ResolverInputTypes["RespondOnServiceRequestInput"]},ResolverInputTypes["RespondOnServiceRequestRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["MailgunData"]: {
	to: string,
	subject: string,
	message: string,
	from?: string | undefined | null
};
	["GetBookingsForServiceInput"]: {
	page?: ResolverInputTypes["PageOptionsInput"] | undefined | null,
	filters?: ResolverInputTypes["GetBookingsForServiceFiltersInput"] | undefined | null
};
	["GetBookingsForServiceFiltersInput"]: {
	fromDate?: ResolverInputTypes["Date"] | undefined | null,
	toDate?: ResolverInputTypes["Date"] | undefined | null,
	bookerId?: string | undefined | null,
	status?: ResolverInputTypes["BookStatus"] | undefined | null
};
	["GetBookingsForServiceRespond"]: AliasType<{
	books?:ResolverInputTypes["BookingRecord"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RespondOnServiceRequestInput"]: {
	bookIds: Array<string>,
	/** answer field cannot be PENDING, otherwise it will throw error */
	answer: ResolverInputTypes["BookStatus"]
};
	["GetSelfServicesInput"]: {
	page?: ResolverInputTypes["PageOptionsInput"] | undefined | null,
	filters?: ResolverInputTypes["GetSelfServicesFiltersInput"] | undefined | null
};
	["GetSelfServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined | null,
	/** description is regex */
	description?: string | undefined | null,
	fromDate?: ResolverInputTypes["Date"] | undefined | null,
	toDate?: ResolverInputTypes["Date"] | undefined | null
};
	["GetSelfServicesRespond"]: AliasType<{
	service?:ResolverInputTypes["Service"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RespondOnServiceRequestRespond"]: AliasType<{
	status?:boolean | `@${string}`,
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["GetBooksInput"]: {
	page?: ResolverInputTypes["PageOptionsInput"] | undefined | null,
	filters?: ResolverInputTypes["GetBooksFiltersInput"] | undefined | null
};
	["GetBooksFiltersInput"]: {
	startDate: string
};
	["ListServicesInput"]: {
	page?: ResolverInputTypes["PageOptionsInput"] | undefined | null,
	filters?: ResolverInputTypes["ListServicesFiltersInput"] | undefined | null
};
	["GetBooksRepsond"]: AliasType<{
	books?:ResolverInputTypes["BookingRecord"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["ListServicesRespond"]: AliasType<{
	services?:ResolverInputTypes["Service"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["GetServiceRespond"]: AliasType<{
	service?:ResolverInputTypes["Service"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RegisterUserInput"]: {
	username: string,
	email: string,
	phone?: string | undefined | null
};
	["RegisterServiceInput"]: {
	name: string,
	description?: string | undefined | null,
	startDates: Array<ResolverInputTypes["Date"]>,
	time?: number | undefined | null,
	neededAccept?: boolean | undefined | null,
	active?: boolean | undefined | null
};
	["RegisterServiceRespond"]: AliasType<{
	service?:ResolverInputTypes["Service"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["UpdateServiceInput"]: {
	serviceId: string,
	name?: string | undefined | null,
	description?: string | undefined | null,
	startDate?: ResolverInputTypes["Date"] | undefined | null,
	time?: number | undefined | null,
	active?: boolean | undefined | null,
	neededAccept?: boolean | undefined | null
};
	["UpdateServiceRespond"]: AliasType<{
	service?:ResolverInputTypes["Service"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RemoveServiceRespond"]: AliasType<{
	removed?:boolean | `@${string}`,
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RemoveBookingRespond"]: AliasType<{
	removed?:boolean | `@${string}`,
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookServiceInput"]: {
	serviceIds: Array<string>,
	comments?: string | undefined | null
};
	["BookServiceRespond"]: AliasType<{
	book?:ResolverInputTypes["BookingRecord"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["UserServiceRespond"]: AliasType<{
	service?:ResolverInputTypes["Service"],
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["Service"]: AliasType<{
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	ownerId?:boolean | `@${string}`,
	/** this field capture time, system does not recognize units, so be consent with your behavior */
	time?:boolean | `@${string}`,
	startDate?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	taken?:boolean | `@${string}`,
	neededAccept?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BookingRecord"]: AliasType<{
	bookerId?:boolean | `@${string}`,
	services?:ResolverInputTypes["Service"],
	comments?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	answeredAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GlobalError"]: AliasType<{
	/** custom message of error */
	message?:boolean | `@${string}`,
	/** path is name of resolver on which we got error */
	path?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["dbEssentials"]:AliasType<{
		_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`;
		['...on Service']?: Omit<ResolverInputTypes["Service"],keyof ResolverInputTypes["dbEssentials"]>;
		['...on BookingRecord']?: Omit<ResolverInputTypes["BookingRecord"],keyof ResolverInputTypes["dbEssentials"]>;
		__typename?: boolean | `@${string}`
}>;
	["PageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined | null,
	/** count stating from 0 */
	page?: number | undefined | null
};
	["ListServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined | null,
	/** description is regex */
	description?: string | undefined | null,
	fromDate?: ResolverInputTypes["Date"] | undefined | null,
	toDate?: ResolverInputTypes["Date"] | undefined | null,
	ownerId?: string | undefined | null
};
	["Date"]:unknown;
	["BookStatus"]:BookStatus;
	["ServiceType"]:ServiceType;
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["Query"]: {
		/** if used user query endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserQuery will throw error about malformed source */
	user?: ModelTypes["UserQuery"] | undefined,
	public?: ModelTypes["PublicQuery"] | undefined
};
	["UserQuery"]: {
		/** This endpoint returns books owned by the user and sorted by the date of creation. */
	getSelfBooks: ModelTypes["GetBooksRepsond"],
	/** This endpoint returns bookings for a specific service and sorted by the date of creation. */
	getBookingsForService: ModelTypes["GetBookingsForServiceRespond"],
	/** This endpoint returns services owned by the user and sorted by the date of creation. */
	getSelfServices: ModelTypes["GetSelfServicesRespond"]
};
	["Mutation"]: {
		/** if used user mutation endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserMutation will throw error about malformed source */
	user?: ModelTypes["UserMutation"] | undefined
};
	["PublicQuery"]: {
		listServices: ModelTypes["ListServicesRespond"],
	getService: ModelTypes["GetServiceRespond"]
};
	["UserMutation"]: {
		registerService?: ModelTypes["RegisterServiceRespond"] | undefined,
	updateService: ModelTypes["UpdateServiceRespond"],
	removeService: ModelTypes["RemoveServiceRespond"],
	bookService: ModelTypes["BookServiceRespond"],
	send?: string | undefined,
	respondOnServiceRequest: ModelTypes["RespondOnServiceRequestRespond"]
};
	["MailgunData"]: {
	to: string,
	subject: string,
	message: string,
	from?: string | undefined
};
	["GetBookingsForServiceInput"]: {
	page?: ModelTypes["PageOptionsInput"] | undefined,
	filters?: ModelTypes["GetBookingsForServiceFiltersInput"] | undefined
};
	["GetBookingsForServiceFiltersInput"]: {
	fromDate?: ModelTypes["Date"] | undefined,
	toDate?: ModelTypes["Date"] | undefined,
	bookerId?: string | undefined,
	status?: ModelTypes["BookStatus"] | undefined
};
	["GetBookingsForServiceRespond"]: {
		books?: Array<ModelTypes["BookingRecord"]> | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["RespondOnServiceRequestInput"]: {
	bookIds: Array<string>,
	/** answer field cannot be PENDING, otherwise it will throw error */
	answer: ModelTypes["BookStatus"]
};
	["GetSelfServicesInput"]: {
	page?: ModelTypes["PageOptionsInput"] | undefined,
	filters?: ModelTypes["GetSelfServicesFiltersInput"] | undefined
};
	["GetSelfServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined,
	/** description is regex */
	description?: string | undefined,
	fromDate?: ModelTypes["Date"] | undefined,
	toDate?: ModelTypes["Date"] | undefined
};
	["GetSelfServicesRespond"]: {
		service?: Array<ModelTypes["Service"]> | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["RespondOnServiceRequestRespond"]: {
		status: boolean,
	error?: ModelTypes["GlobalError"] | undefined
};
	["GetBooksInput"]: {
	page?: ModelTypes["PageOptionsInput"] | undefined,
	filters?: ModelTypes["GetBooksFiltersInput"] | undefined
};
	["GetBooksFiltersInput"]: {
	startDate: string
};
	["ListServicesInput"]: {
	page?: ModelTypes["PageOptionsInput"] | undefined,
	filters?: ModelTypes["ListServicesFiltersInput"] | undefined
};
	["GetBooksRepsond"]: {
		books?: Array<ModelTypes["BookingRecord"]> | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["ListServicesRespond"]: {
		services?: Array<ModelTypes["Service"]> | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["GetServiceRespond"]: {
		service?: ModelTypes["Service"] | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["RegisterUserInput"]: {
	username: string,
	email: string,
	phone?: string | undefined
};
	["RegisterServiceInput"]: {
	name: string,
	description?: string | undefined,
	startDates: Array<ModelTypes["Date"]>,
	time?: number | undefined,
	neededAccept?: boolean | undefined,
	active?: boolean | undefined
};
	["RegisterServiceRespond"]: {
		service?: Array<ModelTypes["Service"]> | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["UpdateServiceInput"]: {
	serviceId: string,
	name?: string | undefined,
	description?: string | undefined,
	startDate?: ModelTypes["Date"] | undefined,
	time?: number | undefined,
	active?: boolean | undefined,
	neededAccept?: boolean | undefined
};
	["UpdateServiceRespond"]: {
		service?: Array<ModelTypes["Service"]> | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["RemoveServiceRespond"]: {
		removed?: boolean | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["RemoveBookingRespond"]: {
		removed?: boolean | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["BookServiceInput"]: {
	serviceIds: Array<string>,
	comments?: string | undefined
};
	["BookServiceRespond"]: {
		book?: ModelTypes["BookingRecord"] | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["UserServiceRespond"]: {
		service?: Array<ModelTypes["Service"] | undefined> | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["Service"]: {
		name: string,
	description?: string | undefined,
	ownerId: string,
	/** this field capture time, system does not recognize units, so be consent with your behavior */
	time?: number | undefined,
	startDate: ModelTypes["Date"],
	_id: string,
	createdAt: ModelTypes["Date"],
	updatedAt?: ModelTypes["Date"] | undefined,
	active?: boolean | undefined,
	taken?: boolean | undefined,
	neededAccept?: boolean | undefined
};
	["BookingRecord"]: {
		bookerId: string,
	services?: Array<ModelTypes["Service"]> | undefined,
	comments?: string | undefined,
	_id: string,
	createdAt: ModelTypes["Date"],
	status: ModelTypes["BookStatus"],
	answeredAt?: ModelTypes["Date"] | undefined
};
	["GlobalError"]: {
		/** custom message of error */
	message?: string | undefined,
	/** path is name of resolver on which we got error */
	path?: string | undefined
};
	["dbEssentials"]: ModelTypes["Service"] | ModelTypes["BookingRecord"];
	["PageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined,
	/** count stating from 0 */
	page?: number | undefined
};
	["ListServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined,
	/** description is regex */
	description?: string | undefined,
	fromDate?: ModelTypes["Date"] | undefined,
	toDate?: ModelTypes["Date"] | undefined,
	ownerId?: string | undefined
};
	["Date"]:any;
	["BookStatus"]:BookStatus;
	["ServiceType"]:ServiceType;
	["schema"]: {
	query?: ModelTypes["Query"] | undefined,
	mutation?: ModelTypes["Mutation"] | undefined
}
    }

export type GraphQLTypes = {
    ["Query"]: {
	__typename: "Query",
	/** if used user query endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserQuery will throw error about malformed source */
	user?: GraphQLTypes["UserQuery"] | undefined,
	public?: GraphQLTypes["PublicQuery"] | undefined
};
	["UserQuery"]: {
	__typename: "UserQuery",
	/** This endpoint returns books owned by the user and sorted by the date of creation. */
	getSelfBooks: GraphQLTypes["GetBooksRepsond"],
	/** This endpoint returns bookings for a specific service and sorted by the date of creation. */
	getBookingsForService: GraphQLTypes["GetBookingsForServiceRespond"],
	/** This endpoint returns services owned by the user and sorted by the date of creation. */
	getSelfServices: GraphQLTypes["GetSelfServicesRespond"]
};
	["Mutation"]: {
	__typename: "Mutation",
	/** if used user mutation endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserMutation will throw error about malformed source */
	user?: GraphQLTypes["UserMutation"] | undefined
};
	["PublicQuery"]: {
	__typename: "PublicQuery",
	listServices: GraphQLTypes["ListServicesRespond"],
	getService: GraphQLTypes["GetServiceRespond"]
};
	["UserMutation"]: {
	__typename: "UserMutation",
	registerService?: GraphQLTypes["RegisterServiceRespond"] | undefined,
	updateService: GraphQLTypes["UpdateServiceRespond"],
	removeService: GraphQLTypes["RemoveServiceRespond"],
	bookService: GraphQLTypes["BookServiceRespond"],
	send?: string | undefined,
	respondOnServiceRequest: GraphQLTypes["RespondOnServiceRequestRespond"]
};
	["MailgunData"]: {
		to: string,
	subject: string,
	message: string,
	from?: string | undefined
};
	["GetBookingsForServiceInput"]: {
		page?: GraphQLTypes["PageOptionsInput"] | undefined,
	filters?: GraphQLTypes["GetBookingsForServiceFiltersInput"] | undefined
};
	["GetBookingsForServiceFiltersInput"]: {
		fromDate?: GraphQLTypes["Date"] | undefined,
	toDate?: GraphQLTypes["Date"] | undefined,
	bookerId?: string | undefined,
	status?: GraphQLTypes["BookStatus"] | undefined
};
	["GetBookingsForServiceRespond"]: {
	__typename: "GetBookingsForServiceRespond",
	books?: Array<GraphQLTypes["BookingRecord"]> | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["RespondOnServiceRequestInput"]: {
		bookIds: Array<string>,
	/** answer field cannot be PENDING, otherwise it will throw error */
	answer: GraphQLTypes["BookStatus"]
};
	["GetSelfServicesInput"]: {
		page?: GraphQLTypes["PageOptionsInput"] | undefined,
	filters?: GraphQLTypes["GetSelfServicesFiltersInput"] | undefined
};
	["GetSelfServicesFiltersInput"]: {
		/** name is regex */
	name?: string | undefined,
	/** description is regex */
	description?: string | undefined,
	fromDate?: GraphQLTypes["Date"] | undefined,
	toDate?: GraphQLTypes["Date"] | undefined
};
	["GetSelfServicesRespond"]: {
	__typename: "GetSelfServicesRespond",
	service?: Array<GraphQLTypes["Service"]> | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["RespondOnServiceRequestRespond"]: {
	__typename: "RespondOnServiceRequestRespond",
	status: boolean,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["GetBooksInput"]: {
		page?: GraphQLTypes["PageOptionsInput"] | undefined,
	filters?: GraphQLTypes["GetBooksFiltersInput"] | undefined
};
	["GetBooksFiltersInput"]: {
		startDate: string
};
	["ListServicesInput"]: {
		page?: GraphQLTypes["PageOptionsInput"] | undefined,
	filters?: GraphQLTypes["ListServicesFiltersInput"] | undefined
};
	["GetBooksRepsond"]: {
	__typename: "GetBooksRepsond",
	books?: Array<GraphQLTypes["BookingRecord"]> | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["ListServicesRespond"]: {
	__typename: "ListServicesRespond",
	services?: Array<GraphQLTypes["Service"]> | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["GetServiceRespond"]: {
	__typename: "GetServiceRespond",
	service?: GraphQLTypes["Service"] | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["RegisterUserInput"]: {
		username: string,
	email: string,
	phone?: string | undefined
};
	["RegisterServiceInput"]: {
		name: string,
	description?: string | undefined,
	startDates: Array<GraphQLTypes["Date"]>,
	time?: number | undefined,
	neededAccept?: boolean | undefined,
	active?: boolean | undefined
};
	["RegisterServiceRespond"]: {
	__typename: "RegisterServiceRespond",
	service?: Array<GraphQLTypes["Service"]> | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["UpdateServiceInput"]: {
		serviceId: string,
	name?: string | undefined,
	description?: string | undefined,
	startDate?: GraphQLTypes["Date"] | undefined,
	time?: number | undefined,
	active?: boolean | undefined,
	neededAccept?: boolean | undefined
};
	["UpdateServiceRespond"]: {
	__typename: "UpdateServiceRespond",
	service?: Array<GraphQLTypes["Service"]> | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["RemoveServiceRespond"]: {
	__typename: "RemoveServiceRespond",
	removed?: boolean | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["RemoveBookingRespond"]: {
	__typename: "RemoveBookingRespond",
	removed?: boolean | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["BookServiceInput"]: {
		serviceIds: Array<string>,
	comments?: string | undefined
};
	["BookServiceRespond"]: {
	__typename: "BookServiceRespond",
	book?: GraphQLTypes["BookingRecord"] | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["UserServiceRespond"]: {
	__typename: "UserServiceRespond",
	service?: Array<GraphQLTypes["Service"] | undefined> | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["Service"]: {
	__typename: "Service",
	name: string,
	description?: string | undefined,
	ownerId: string,
	/** this field capture time, system does not recognize units, so be consent with your behavior */
	time?: number | undefined,
	startDate: GraphQLTypes["Date"],
	_id: string,
	createdAt: GraphQLTypes["Date"],
	updatedAt?: GraphQLTypes["Date"] | undefined,
	active?: boolean | undefined,
	taken?: boolean | undefined,
	neededAccept?: boolean | undefined
};
	["BookingRecord"]: {
	__typename: "BookingRecord",
	bookerId: string,
	services?: Array<GraphQLTypes["Service"]> | undefined,
	comments?: string | undefined,
	_id: string,
	createdAt: GraphQLTypes["Date"],
	status: GraphQLTypes["BookStatus"],
	answeredAt?: GraphQLTypes["Date"] | undefined
};
	["GlobalError"]: {
	__typename: "GlobalError",
	/** custom message of error */
	message?: string | undefined,
	/** path is name of resolver on which we got error */
	path?: string | undefined
};
	["dbEssentials"]: {
	__typename:"Service" | "BookingRecord",
	_id: string,
	createdAt: GraphQLTypes["Date"]
	['...on Service']: '__union' & GraphQLTypes["Service"];
	['...on BookingRecord']: '__union' & GraphQLTypes["BookingRecord"];
};
	["PageOptionsInput"]: {
		/** default limit is 10 */
	limit?: number | undefined,
	/** count stating from 0 */
	page?: number | undefined
};
	["ListServicesFiltersInput"]: {
		/** name is regex */
	name?: string | undefined,
	/** description is regex */
	description?: string | undefined,
	fromDate?: GraphQLTypes["Date"] | undefined,
	toDate?: GraphQLTypes["Date"] | undefined,
	ownerId?: string | undefined
};
	["Date"]: "scalar" & { name: "Date" };
	["BookStatus"]: BookStatus;
	["ServiceType"]: ServiceType
    }
export const enum BookStatus {
	PENDING = "PENDING",
	ACCEPTED = "ACCEPTED",
	DECLINED = "DECLINED"
}
export const enum ServiceType {
	TIME = "TIME",
	EXPIRATION = "EXPIRATION"
}

type ZEUS_VARIABLES = {
	["MailgunData"]: ValueTypes["MailgunData"];
	["GetBookingsForServiceInput"]: ValueTypes["GetBookingsForServiceInput"];
	["GetBookingsForServiceFiltersInput"]: ValueTypes["GetBookingsForServiceFiltersInput"];
	["RespondOnServiceRequestInput"]: ValueTypes["RespondOnServiceRequestInput"];
	["GetSelfServicesInput"]: ValueTypes["GetSelfServicesInput"];
	["GetSelfServicesFiltersInput"]: ValueTypes["GetSelfServicesFiltersInput"];
	["GetBooksInput"]: ValueTypes["GetBooksInput"];
	["GetBooksFiltersInput"]: ValueTypes["GetBooksFiltersInput"];
	["ListServicesInput"]: ValueTypes["ListServicesInput"];
	["RegisterUserInput"]: ValueTypes["RegisterUserInput"];
	["RegisterServiceInput"]: ValueTypes["RegisterServiceInput"];
	["UpdateServiceInput"]: ValueTypes["UpdateServiceInput"];
	["BookServiceInput"]: ValueTypes["BookServiceInput"];
	["PageOptionsInput"]: ValueTypes["PageOptionsInput"];
	["ListServicesFiltersInput"]: ValueTypes["ListServicesFiltersInput"];
	["Date"]: ValueTypes["Date"];
	["BookStatus"]: ValueTypes["BookStatus"];
	["ServiceType"]: ValueTypes["ServiceType"];
}