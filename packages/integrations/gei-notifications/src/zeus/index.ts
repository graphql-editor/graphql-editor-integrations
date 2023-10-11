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
type ZEUS_INTERFACES = GraphQLTypes["DbEssentials"] | GraphQLTypes["error"]
export type ScalarCoders = {
	Date?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["Query"]: AliasType<{
userQuery?: [{	userId: string | Variable<any, string>},ValueTypes["UserQuery"]],
	publicQuery?:ValueTypes["PublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UserQuery"]: AliasType<{
listNotifications?: [{	input?: ValueTypes["ListNotificationsInput"] | undefined | null | Variable<any, string>},ValueTypes["ListNotificationsResult"]],
listChannels?: [{	input?: ValueTypes["ListChannelsInput"] | undefined | null | Variable<any, string>},ValueTypes["ListChannelsResult"]],
	generatePushNotificationToken?:ValueTypes["GeneratePushNotificationTokenResult"],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
userMutation?: [{	userId: string | Variable<any, string>},ValueTypes["UserMutation"]],
		__typename?: boolean | `@${string}`
}>;
	["UserMutation"]: AliasType<{
sendStaticNotification?: [{	input: ValueTypes["SendStaticNotificationInput"] | Variable<any, string>},ValueTypes["SendStaticNotificationResult"]],
sendPushNotificationToUsers?: [{	input: ValueTypes["SendPushNotificationInput"] | Variable<any, string>},ValueTypes["SendStaticNotificationResult"]],
sendPushNotificationToInterests?: [{	input: ValueTypes["SendPushNotificationInput"] | Variable<any, string>},ValueTypes["SendStaticNotificationResult"]],
getChannelAuthorization?: [{	input: ValueTypes["GetChannelAuthorizationInput"] | Variable<any, string>},ValueTypes["GetChannelAuthorizationResult"]],
getBeamAuthorization?: [{	userId?: string | undefined | null | Variable<any, string>},ValueTypes["GetChannelAuthorizationResult"]],
		__typename?: boolean | `@${string}`
}>;
	["PublicQuery"]: AliasType<{
listNotificationGroups?: [{	input?: ValueTypes["ListNotificationGroupsInput"] | undefined | null | Variable<any, string>},ValueTypes["ListNotificationGroupsResult"]],
		__typename?: boolean | `@${string}`
}>;
	["NotificationGroupOps"]: AliasType<{
addUserToGroup?: [{	userIds?: Array<string> | undefined | null | Variable<any, string>},ValueTypes["AddUserToGroupResult"]],
removeUserFromGroup?: [{	userIds?: Array<string> | undefined | null | Variable<any, string>},ValueTypes["RemoveUserToGroupResult"]],
editNotificationGroup?: [{	input: ValueTypes["EditNotificationGroupInput"] | Variable<any, string>},ValueTypes["EditNotificationGroupResult"]],
	deleteNotificationGroup?:ValueTypes["DeleteNotificationGroupResult"],
		__typename?: boolean | `@${string}`
}>;
	["GeneratePushNotificationTokenResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	token?:boolean | `@${string}`,
	exp?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GetChannelAuthorizationInput"]: {
	targetId: string | Variable<any, string>,
	socketId: string | Variable<any, string>
};
	["GetChannelAuthorizationResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	auth?:boolean | `@${string}`,
	channel_data?:boolean | `@${string}`,
	shared_secret?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ListChannelsInput"]: {
	page?: ValueTypes["PageOptionsInput"] | undefined | null | Variable<any, string>
};
	["ListNotificationGroupsInput"]: {
	page?: ValueTypes["PageOptionsInput"] | undefined | null | Variable<any, string>,
	filter?: ValueTypes["ListNotificationGroupsInputFilter"] | undefined | null | Variable<any, string>
};
	["ListNotificationGroupsInputFilter"]: {
	/** this is a regex searching */
	name?: string | undefined | null | Variable<any, string>,
	/** if targetId is filled, this filter will return Notification groups that contains inside specific target */
	targetId?: string | undefined | null | Variable<any, string>,
	sortDirection?: ValueTypes["SortDirection"] | undefined | null | Variable<any, string>,
	notificationType?: ValueTypes["NotificationType"] | undefined | null | Variable<any, string>,
	startDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	endDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>
};
	["ListNotificationsInput"]: {
	filter?: ValueTypes["ListNotificationsInputFilter"] | undefined | null | Variable<any, string>,
	page?: ValueTypes["PageOptionsInput"] | undefined | null | Variable<any, string>
};
	["ListNotificationsInputFilter"]: {
	notificationType?: ValueTypes["NotificationType"] | undefined | null | Variable<any, string>,
	sortDirection?: ValueTypes["SortDirection"] | undefined | null | Variable<any, string>,
	isReaded?: boolean | undefined | null | Variable<any, string>,
	startDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	endDate?: ValueTypes["Date"] | undefined | null | Variable<any, string>
};
	["SendStaticNotificationInput"]: {
	channelsId: Array<string> | Variable<any, string>,
	message: string | Variable<any, string>,
	event: string | Variable<any, string>
};
	["SendPushNotificationInput"]: {
	targets: Array<string> | Variable<any, string>,
	notification: ValueTypes["NotificationPayloadInput"] | Variable<any, string>
};
	["NotificationPayloadInput"]: {
	title: string | Variable<any, string>,
	body: string | Variable<any, string>
};
	["ListChannelsResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	result?:ValueTypes["Channel"],
	page?:ValueTypes["PageOptionsResult"],
		__typename?: boolean | `@${string}`
}>;
	["DeleteNotificationGroupResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SendStaticNotificationResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["EditNotificationGroupResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["EditNotificationGroupInput"]: {
	name?: string | undefined | null | Variable<any, string>,
	users?: Array<string> | undefined | null | Variable<any, string>
};
	["AddUserToGroupResult"]: AliasType<{
	result?:boolean | `@${string}`,
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RemoveUserToGroupResult"]: AliasType<{
	result?:boolean | `@${string}`,
	error?:ValueTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["CreateNotificationGroupResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateNotificationGroupInput"]: {
	name: string | Variable<any, string>,
	users: Array<string> | Variable<any, string>,
	notificationType: ValueTypes["NotificationType"] | Variable<any, string>
};
	["MarkNotificationReadedResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MarkNotificationReadedInput"]: {
	state: boolean | Variable<any, string>,
	notificationId: string | Variable<any, string>
};
	["ListNotificationGroupsResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	notificationGroup?:ValueTypes["NotificationGroup"],
		__typename?: boolean | `@${string}`
}>;
	["ListNotificationsResult"]: AliasType<{
	error?:ValueTypes["GlobalError"],
	notification?:ValueTypes["Notification"],
	page?:ValueTypes["PageOptionsResult"],
		__typename?: boolean | `@${string}`
}>;
	["GlobalError"]: AliasType<{
	message?:boolean | `@${string}`,
	path?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Notification"]: AliasType<{
	body?:boolean | `@${string}`,
	targetIds?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	isReaded?:boolean | `@${string}`,
	notificationType?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["NotificationGroup"]: AliasType<{
	targets?:boolean | `@${string}`,
	notificationType?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["NotificationReaded"]: AliasType<{
	userId?:boolean | `@${string}`,
	notificationId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Channel"]: AliasType<{
	channelId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined | null | Variable<any, string>,
	/** count stating from 0 */
	page?: number | undefined | null | Variable<any, string>
};
	["PageOptionsResult"]: AliasType<{
	count?:boolean | `@${string}`,
	hasNext?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DbEssentials"]:AliasType<{
		_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`;
		['...on Notification']?: Omit<ValueTypes["Notification"],keyof ValueTypes["DbEssentials"]>;
		['...on NotificationGroup']?: Omit<ValueTypes["NotificationGroup"],keyof ValueTypes["DbEssentials"]>;
		__typename?: boolean | `@${string}`
}>;
	["error"]:AliasType<{
		error?:ValueTypes["GlobalError"];
		['...on AddUserToGroupResult']?: Omit<ValueTypes["AddUserToGroupResult"],keyof ValueTypes["error"]>;
		['...on RemoveUserToGroupResult']?: Omit<ValueTypes["RemoveUserToGroupResult"],keyof ValueTypes["error"]>;
		['...on CreateNotificationGroupResult']?: Omit<ValueTypes["CreateNotificationGroupResult"],keyof ValueTypes["error"]>;
		['...on ListNotificationGroupsResult']?: Omit<ValueTypes["ListNotificationGroupsResult"],keyof ValueTypes["error"]>;
		['...on ListNotificationsResult']?: Omit<ValueTypes["ListNotificationsResult"],keyof ValueTypes["error"]>;
		__typename?: boolean | `@${string}`
}>;
	["NotificationTargetType"]:NotificationTargetType;
	["SortDirection"]:SortDirection;
	["NotificationType"]:NotificationType;
	["Date"]:unknown
  }

export type ResolverInputTypes = {
    ["Query"]: AliasType<{
userQuery?: [{	userId: string},ResolverInputTypes["UserQuery"]],
	publicQuery?:ResolverInputTypes["PublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UserQuery"]: AliasType<{
listNotifications?: [{	input?: ResolverInputTypes["ListNotificationsInput"] | undefined | null},ResolverInputTypes["ListNotificationsResult"]],
listChannels?: [{	input?: ResolverInputTypes["ListChannelsInput"] | undefined | null},ResolverInputTypes["ListChannelsResult"]],
	generatePushNotificationToken?:ResolverInputTypes["GeneratePushNotificationTokenResult"],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
userMutation?: [{	userId: string},ResolverInputTypes["UserMutation"]],
		__typename?: boolean | `@${string}`
}>;
	["UserMutation"]: AliasType<{
sendStaticNotification?: [{	input: ResolverInputTypes["SendStaticNotificationInput"]},ResolverInputTypes["SendStaticNotificationResult"]],
sendPushNotificationToUsers?: [{	input: ResolverInputTypes["SendPushNotificationInput"]},ResolverInputTypes["SendStaticNotificationResult"]],
sendPushNotificationToInterests?: [{	input: ResolverInputTypes["SendPushNotificationInput"]},ResolverInputTypes["SendStaticNotificationResult"]],
getChannelAuthorization?: [{	input: ResolverInputTypes["GetChannelAuthorizationInput"]},ResolverInputTypes["GetChannelAuthorizationResult"]],
getBeamAuthorization?: [{	userId?: string | undefined | null},ResolverInputTypes["GetChannelAuthorizationResult"]],
		__typename?: boolean | `@${string}`
}>;
	["PublicQuery"]: AliasType<{
listNotificationGroups?: [{	input?: ResolverInputTypes["ListNotificationGroupsInput"] | undefined | null},ResolverInputTypes["ListNotificationGroupsResult"]],
		__typename?: boolean | `@${string}`
}>;
	["NotificationGroupOps"]: AliasType<{
addUserToGroup?: [{	userIds?: Array<string> | undefined | null},ResolverInputTypes["AddUserToGroupResult"]],
removeUserFromGroup?: [{	userIds?: Array<string> | undefined | null},ResolverInputTypes["RemoveUserToGroupResult"]],
editNotificationGroup?: [{	input: ResolverInputTypes["EditNotificationGroupInput"]},ResolverInputTypes["EditNotificationGroupResult"]],
	deleteNotificationGroup?:ResolverInputTypes["DeleteNotificationGroupResult"],
		__typename?: boolean | `@${string}`
}>;
	["GeneratePushNotificationTokenResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	token?:boolean | `@${string}`,
	exp?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GetChannelAuthorizationInput"]: {
	targetId: string,
	socketId: string
};
	["GetChannelAuthorizationResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	auth?:boolean | `@${string}`,
	channel_data?:boolean | `@${string}`,
	shared_secret?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ListChannelsInput"]: {
	page?: ResolverInputTypes["PageOptionsInput"] | undefined | null
};
	["ListNotificationGroupsInput"]: {
	page?: ResolverInputTypes["PageOptionsInput"] | undefined | null,
	filter?: ResolverInputTypes["ListNotificationGroupsInputFilter"] | undefined | null
};
	["ListNotificationGroupsInputFilter"]: {
	/** this is a regex searching */
	name?: string | undefined | null,
	/** if targetId is filled, this filter will return Notification groups that contains inside specific target */
	targetId?: string | undefined | null,
	sortDirection?: ResolverInputTypes["SortDirection"] | undefined | null,
	notificationType?: ResolverInputTypes["NotificationType"] | undefined | null,
	startDate?: ResolverInputTypes["Date"] | undefined | null,
	endDate?: ResolverInputTypes["Date"] | undefined | null
};
	["ListNotificationsInput"]: {
	filter?: ResolverInputTypes["ListNotificationsInputFilter"] | undefined | null,
	page?: ResolverInputTypes["PageOptionsInput"] | undefined | null
};
	["ListNotificationsInputFilter"]: {
	notificationType?: ResolverInputTypes["NotificationType"] | undefined | null,
	sortDirection?: ResolverInputTypes["SortDirection"] | undefined | null,
	isReaded?: boolean | undefined | null,
	startDate?: ResolverInputTypes["Date"] | undefined | null,
	endDate?: ResolverInputTypes["Date"] | undefined | null
};
	["SendStaticNotificationInput"]: {
	channelsId: Array<string>,
	message: string,
	event: string
};
	["SendPushNotificationInput"]: {
	targets: Array<string>,
	notification: ResolverInputTypes["NotificationPayloadInput"]
};
	["NotificationPayloadInput"]: {
	title: string,
	body: string
};
	["ListChannelsResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	result?:ResolverInputTypes["Channel"],
	page?:ResolverInputTypes["PageOptionsResult"],
		__typename?: boolean | `@${string}`
}>;
	["DeleteNotificationGroupResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SendStaticNotificationResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["EditNotificationGroupResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["EditNotificationGroupInput"]: {
	name?: string | undefined | null,
	users?: Array<string> | undefined | null
};
	["AddUserToGroupResult"]: AliasType<{
	result?:boolean | `@${string}`,
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["RemoveUserToGroupResult"]: AliasType<{
	result?:boolean | `@${string}`,
	error?:ResolverInputTypes["GlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["CreateNotificationGroupResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateNotificationGroupInput"]: {
	name: string,
	users: Array<string>,
	notificationType: ResolverInputTypes["NotificationType"]
};
	["MarkNotificationReadedResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	result?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MarkNotificationReadedInput"]: {
	state: boolean,
	notificationId: string
};
	["ListNotificationGroupsResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	notificationGroup?:ResolverInputTypes["NotificationGroup"],
		__typename?: boolean | `@${string}`
}>;
	["ListNotificationsResult"]: AliasType<{
	error?:ResolverInputTypes["GlobalError"],
	notification?:ResolverInputTypes["Notification"],
	page?:ResolverInputTypes["PageOptionsResult"],
		__typename?: boolean | `@${string}`
}>;
	["GlobalError"]: AliasType<{
	message?:boolean | `@${string}`,
	path?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Notification"]: AliasType<{
	body?:boolean | `@${string}`,
	targetIds?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	isReaded?:boolean | `@${string}`,
	notificationType?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["NotificationGroup"]: AliasType<{
	targets?:boolean | `@${string}`,
	notificationType?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["NotificationReaded"]: AliasType<{
	userId?:boolean | `@${string}`,
	notificationId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Channel"]: AliasType<{
	channelId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined | null,
	/** count stating from 0 */
	page?: number | undefined | null
};
	["PageOptionsResult"]: AliasType<{
	count?:boolean | `@${string}`,
	hasNext?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DbEssentials"]:AliasType<{
		_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`;
		['...on Notification']?: Omit<ResolverInputTypes["Notification"],keyof ResolverInputTypes["DbEssentials"]>;
		['...on NotificationGroup']?: Omit<ResolverInputTypes["NotificationGroup"],keyof ResolverInputTypes["DbEssentials"]>;
		__typename?: boolean | `@${string}`
}>;
	["error"]:AliasType<{
		error?:ResolverInputTypes["GlobalError"];
		['...on AddUserToGroupResult']?: Omit<ResolverInputTypes["AddUserToGroupResult"],keyof ResolverInputTypes["error"]>;
		['...on RemoveUserToGroupResult']?: Omit<ResolverInputTypes["RemoveUserToGroupResult"],keyof ResolverInputTypes["error"]>;
		['...on CreateNotificationGroupResult']?: Omit<ResolverInputTypes["CreateNotificationGroupResult"],keyof ResolverInputTypes["error"]>;
		['...on ListNotificationGroupsResult']?: Omit<ResolverInputTypes["ListNotificationGroupsResult"],keyof ResolverInputTypes["error"]>;
		['...on ListNotificationsResult']?: Omit<ResolverInputTypes["ListNotificationsResult"],keyof ResolverInputTypes["error"]>;
		__typename?: boolean | `@${string}`
}>;
	["NotificationTargetType"]:NotificationTargetType;
	["SortDirection"]:SortDirection;
	["NotificationType"]:NotificationType;
	["Date"]:unknown;
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["Query"]: {
		userQuery?: ModelTypes["UserQuery"] | undefined,
	publicQuery: ModelTypes["PublicQuery"]
};
	["UserQuery"]: {
		listNotifications: ModelTypes["ListNotificationsResult"],
	listChannels: ModelTypes["ListChannelsResult"],
	generatePushNotificationToken: ModelTypes["GeneratePushNotificationTokenResult"]
};
	["Mutation"]: {
		userMutation?: ModelTypes["UserMutation"] | undefined
};
	["UserMutation"]: {
		sendStaticNotification: ModelTypes["SendStaticNotificationResult"],
	sendPushNotificationToUsers: ModelTypes["SendStaticNotificationResult"],
	sendPushNotificationToInterests: ModelTypes["SendStaticNotificationResult"],
	getChannelAuthorization: ModelTypes["GetChannelAuthorizationResult"],
	getBeamAuthorization: ModelTypes["GetChannelAuthorizationResult"]
};
	["PublicQuery"]: {
		listNotificationGroups: ModelTypes["ListNotificationGroupsResult"]
};
	["NotificationGroupOps"]: {
		/** if we adding or removing users, duplicates will be reduced */
	addUserToGroup: ModelTypes["AddUserToGroupResult"],
	removeUserFromGroup: ModelTypes["RemoveUserToGroupResult"],
	editNotificationGroup?: ModelTypes["EditNotificationGroupResult"] | undefined,
	deleteNotificationGroup: ModelTypes["DeleteNotificationGroupResult"]
};
	["GeneratePushNotificationTokenResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	token: string,
	exp?: ModelTypes["Date"] | undefined
};
	["GetChannelAuthorizationInput"]: {
	targetId: string,
	socketId: string
};
	["GetChannelAuthorizationResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	auth?: string | undefined,
	channel_data?: string | undefined,
	shared_secret?: string | undefined
};
	["ListChannelsInput"]: {
	page?: ModelTypes["PageOptionsInput"] | undefined
};
	["ListNotificationGroupsInput"]: {
	page?: ModelTypes["PageOptionsInput"] | undefined,
	filter?: ModelTypes["ListNotificationGroupsInputFilter"] | undefined
};
	["ListNotificationGroupsInputFilter"]: {
	/** this is a regex searching */
	name?: string | undefined,
	/** if targetId is filled, this filter will return Notification groups that contains inside specific target */
	targetId?: string | undefined,
	sortDirection?: ModelTypes["SortDirection"] | undefined,
	notificationType?: ModelTypes["NotificationType"] | undefined,
	startDate?: ModelTypes["Date"] | undefined,
	endDate?: ModelTypes["Date"] | undefined
};
	["ListNotificationsInput"]: {
	filter?: ModelTypes["ListNotificationsInputFilter"] | undefined,
	page?: ModelTypes["PageOptionsInput"] | undefined
};
	["ListNotificationsInputFilter"]: {
	notificationType?: ModelTypes["NotificationType"] | undefined,
	sortDirection?: ModelTypes["SortDirection"] | undefined,
	isReaded?: boolean | undefined,
	startDate?: ModelTypes["Date"] | undefined,
	endDate?: ModelTypes["Date"] | undefined
};
	["SendStaticNotificationInput"]: {
	channelsId: Array<string>,
	message: string,
	event: string
};
	["SendPushNotificationInput"]: {
	targets: Array<string>,
	notification: ModelTypes["NotificationPayloadInput"]
};
	["NotificationPayloadInput"]: {
	title: string,
	body: string
};
	["ListChannelsResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	result?: Array<ModelTypes["Channel"]> | undefined,
	page?: ModelTypes["PageOptionsResult"] | undefined
};
	["DeleteNotificationGroupResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["SendStaticNotificationResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["EditNotificationGroupResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["EditNotificationGroupInput"]: {
	name?: string | undefined,
	users?: Array<string> | undefined
};
	["AddUserToGroupResult"]: {
		result?: boolean | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["RemoveUserToGroupResult"]: {
		result?: boolean | undefined,
	error?: ModelTypes["GlobalError"] | undefined
};
	["CreateNotificationGroupResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["CreateNotificationGroupInput"]: {
	name: string,
	users: Array<string>,
	notificationType: ModelTypes["NotificationType"]
};
	["MarkNotificationReadedResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["MarkNotificationReadedInput"]: {
	state: boolean,
	notificationId: string
};
	["ListNotificationGroupsResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	notificationGroup?: Array<ModelTypes["NotificationGroup"]> | undefined
};
	["ListNotificationsResult"]: {
		error?: ModelTypes["GlobalError"] | undefined,
	notification?: Array<ModelTypes["Notification"]> | undefined,
	page?: ModelTypes["PageOptionsResult"] | undefined
};
	["GlobalError"]: {
		message: string,
	path: string
};
	["Notification"]: {
		body: string,
	targetIds: Array<string>,
	_id: string,
	createdAt: ModelTypes["Date"],
	isReaded: boolean,
	notificationType: ModelTypes["NotificationType"]
};
	["NotificationGroup"]: {
		targets: Array<string>,
	notificationType: ModelTypes["NotificationType"],
	name: string,
	_id: string,
	createdAt: ModelTypes["Date"]
};
	["NotificationReaded"]: {
		userId: string,
	notificationId: string,
	createdAt: ModelTypes["Date"]
};
	["Channel"]: {
		channelId: string,
	createdAt?: ModelTypes["Date"] | undefined
};
	["PageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined,
	/** count stating from 0 */
	page?: number | undefined
};
	["PageOptionsResult"]: {
		count?: number | undefined,
	hasNext?: boolean | undefined
};
	["DbEssentials"]: ModelTypes["Notification"] | ModelTypes["NotificationGroup"];
	["error"]: ModelTypes["AddUserToGroupResult"] | ModelTypes["RemoveUserToGroupResult"] | ModelTypes["CreateNotificationGroupResult"] | ModelTypes["ListNotificationGroupsResult"] | ModelTypes["ListNotificationsResult"];
	["NotificationTargetType"]:NotificationTargetType;
	["SortDirection"]:SortDirection;
	["NotificationType"]:NotificationType;
	["Date"]:any;
	["schema"]: {
	query?: ModelTypes["Query"] | undefined,
	mutation?: ModelTypes["Mutation"] | undefined
}
    }

export type GraphQLTypes = {
    ["Query"]: {
	__typename: "Query",
	userQuery?: GraphQLTypes["UserQuery"] | undefined,
	publicQuery: GraphQLTypes["PublicQuery"]
};
	["UserQuery"]: {
	__typename: "UserQuery",
	listNotifications: GraphQLTypes["ListNotificationsResult"],
	listChannels: GraphQLTypes["ListChannelsResult"],
	generatePushNotificationToken: GraphQLTypes["GeneratePushNotificationTokenResult"]
};
	["Mutation"]: {
	__typename: "Mutation",
	userMutation?: GraphQLTypes["UserMutation"] | undefined
};
	["UserMutation"]: {
	__typename: "UserMutation",
	sendStaticNotification: GraphQLTypes["SendStaticNotificationResult"],
	sendPushNotificationToUsers: GraphQLTypes["SendStaticNotificationResult"],
	sendPushNotificationToInterests: GraphQLTypes["SendStaticNotificationResult"],
	getChannelAuthorization: GraphQLTypes["GetChannelAuthorizationResult"],
	getBeamAuthorization: GraphQLTypes["GetChannelAuthorizationResult"]
};
	["PublicQuery"]: {
	__typename: "PublicQuery",
	listNotificationGroups: GraphQLTypes["ListNotificationGroupsResult"]
};
	["NotificationGroupOps"]: {
	__typename: "NotificationGroupOps",
	/** if we adding or removing users, duplicates will be reduced */
	addUserToGroup: GraphQLTypes["AddUserToGroupResult"],
	removeUserFromGroup: GraphQLTypes["RemoveUserToGroupResult"],
	editNotificationGroup?: GraphQLTypes["EditNotificationGroupResult"] | undefined,
	deleteNotificationGroup: GraphQLTypes["DeleteNotificationGroupResult"]
};
	["GeneratePushNotificationTokenResult"]: {
	__typename: "GeneratePushNotificationTokenResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	token: string,
	exp?: GraphQLTypes["Date"] | undefined
};
	["GetChannelAuthorizationInput"]: {
		targetId: string,
	socketId: string
};
	["GetChannelAuthorizationResult"]: {
	__typename: "GetChannelAuthorizationResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	auth?: string | undefined,
	channel_data?: string | undefined,
	shared_secret?: string | undefined
};
	["ListChannelsInput"]: {
		page?: GraphQLTypes["PageOptionsInput"] | undefined
};
	["ListNotificationGroupsInput"]: {
		page?: GraphQLTypes["PageOptionsInput"] | undefined,
	filter?: GraphQLTypes["ListNotificationGroupsInputFilter"] | undefined
};
	["ListNotificationGroupsInputFilter"]: {
		/** this is a regex searching */
	name?: string | undefined,
	/** if targetId is filled, this filter will return Notification groups that contains inside specific target */
	targetId?: string | undefined,
	sortDirection?: GraphQLTypes["SortDirection"] | undefined,
	notificationType?: GraphQLTypes["NotificationType"] | undefined,
	startDate?: GraphQLTypes["Date"] | undefined,
	endDate?: GraphQLTypes["Date"] | undefined
};
	["ListNotificationsInput"]: {
		filter?: GraphQLTypes["ListNotificationsInputFilter"] | undefined,
	page?: GraphQLTypes["PageOptionsInput"] | undefined
};
	["ListNotificationsInputFilter"]: {
		notificationType?: GraphQLTypes["NotificationType"] | undefined,
	sortDirection?: GraphQLTypes["SortDirection"] | undefined,
	isReaded?: boolean | undefined,
	startDate?: GraphQLTypes["Date"] | undefined,
	endDate?: GraphQLTypes["Date"] | undefined
};
	["SendStaticNotificationInput"]: {
		channelsId: Array<string>,
	message: string,
	event: string
};
	["SendPushNotificationInput"]: {
		targets: Array<string>,
	notification: GraphQLTypes["NotificationPayloadInput"]
};
	["NotificationPayloadInput"]: {
		title: string,
	body: string
};
	["ListChannelsResult"]: {
	__typename: "ListChannelsResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	result?: Array<GraphQLTypes["Channel"]> | undefined,
	page?: GraphQLTypes["PageOptionsResult"] | undefined
};
	["DeleteNotificationGroupResult"]: {
	__typename: "DeleteNotificationGroupResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["SendStaticNotificationResult"]: {
	__typename: "SendStaticNotificationResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["EditNotificationGroupResult"]: {
	__typename: "EditNotificationGroupResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["EditNotificationGroupInput"]: {
		name?: string | undefined,
	users?: Array<string> | undefined
};
	["AddUserToGroupResult"]: {
	__typename: "AddUserToGroupResult",
	result?: boolean | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["RemoveUserToGroupResult"]: {
	__typename: "RemoveUserToGroupResult",
	result?: boolean | undefined,
	error?: GraphQLTypes["GlobalError"] | undefined
};
	["CreateNotificationGroupResult"]: {
	__typename: "CreateNotificationGroupResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["CreateNotificationGroupInput"]: {
		name: string,
	users: Array<string>,
	notificationType: GraphQLTypes["NotificationType"]
};
	["MarkNotificationReadedResult"]: {
	__typename: "MarkNotificationReadedResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	result?: boolean | undefined
};
	["MarkNotificationReadedInput"]: {
		state: boolean,
	notificationId: string
};
	["ListNotificationGroupsResult"]: {
	__typename: "ListNotificationGroupsResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	notificationGroup?: Array<GraphQLTypes["NotificationGroup"]> | undefined
};
	["ListNotificationsResult"]: {
	__typename: "ListNotificationsResult",
	error?: GraphQLTypes["GlobalError"] | undefined,
	notification?: Array<GraphQLTypes["Notification"]> | undefined,
	page?: GraphQLTypes["PageOptionsResult"] | undefined
};
	["GlobalError"]: {
	__typename: "GlobalError",
	message: string,
	path: string
};
	["Notification"]: {
	__typename: "Notification",
	body: string,
	targetIds: Array<string>,
	_id: string,
	createdAt: GraphQLTypes["Date"],
	isReaded: boolean,
	notificationType: GraphQLTypes["NotificationType"]
};
	["NotificationGroup"]: {
	__typename: "NotificationGroup",
	targets: Array<string>,
	notificationType: GraphQLTypes["NotificationType"],
	name: string,
	_id: string,
	createdAt: GraphQLTypes["Date"]
};
	["NotificationReaded"]: {
	__typename: "NotificationReaded",
	userId: string,
	notificationId: string,
	createdAt: GraphQLTypes["Date"]
};
	["Channel"]: {
	__typename: "Channel",
	channelId: string,
	createdAt?: GraphQLTypes["Date"] | undefined
};
	["PageOptionsInput"]: {
		/** default limit is 10 */
	limit?: number | undefined,
	/** count stating from 0 */
	page?: number | undefined
};
	["PageOptionsResult"]: {
	__typename: "PageOptionsResult",
	count?: number | undefined,
	hasNext?: boolean | undefined
};
	["DbEssentials"]: {
	__typename:"Notification" | "NotificationGroup",
	_id: string,
	createdAt: GraphQLTypes["Date"]
	['...on Notification']: '__union' & GraphQLTypes["Notification"];
	['...on NotificationGroup']: '__union' & GraphQLTypes["NotificationGroup"];
};
	["error"]: {
	__typename:"AddUserToGroupResult" | "RemoveUserToGroupResult" | "CreateNotificationGroupResult" | "ListNotificationGroupsResult" | "ListNotificationsResult",
	error?: GraphQLTypes["GlobalError"] | undefined
	['...on AddUserToGroupResult']: '__union' & GraphQLTypes["AddUserToGroupResult"];
	['...on RemoveUserToGroupResult']: '__union' & GraphQLTypes["RemoveUserToGroupResult"];
	['...on CreateNotificationGroupResult']: '__union' & GraphQLTypes["CreateNotificationGroupResult"];
	['...on ListNotificationGroupsResult']: '__union' & GraphQLTypes["ListNotificationGroupsResult"];
	['...on ListNotificationsResult']: '__union' & GraphQLTypes["ListNotificationsResult"];
};
	["NotificationTargetType"]: NotificationTargetType;
	["SortDirection"]: SortDirection;
	["NotificationType"]: NotificationType;
	["Date"]: "scalar" & { name: "Date" }
    }
export const enum NotificationTargetType {
	USER = "USER",
	GROUP = "GROUP"
}
export const enum SortDirection {
	asc = "asc",
	desc = "desc"
}
export const enum NotificationType {
	STATIC = "STATIC",
	PUSH = "PUSH"
}

type ZEUS_VARIABLES = {
	["GetChannelAuthorizationInput"]: ValueTypes["GetChannelAuthorizationInput"];
	["ListChannelsInput"]: ValueTypes["ListChannelsInput"];
	["ListNotificationGroupsInput"]: ValueTypes["ListNotificationGroupsInput"];
	["ListNotificationGroupsInputFilter"]: ValueTypes["ListNotificationGroupsInputFilter"];
	["ListNotificationsInput"]: ValueTypes["ListNotificationsInput"];
	["ListNotificationsInputFilter"]: ValueTypes["ListNotificationsInputFilter"];
	["SendStaticNotificationInput"]: ValueTypes["SendStaticNotificationInput"];
	["SendPushNotificationInput"]: ValueTypes["SendPushNotificationInput"];
	["NotificationPayloadInput"]: ValueTypes["NotificationPayloadInput"];
	["EditNotificationGroupInput"]: ValueTypes["EditNotificationGroupInput"];
	["CreateNotificationGroupInput"]: ValueTypes["CreateNotificationGroupInput"];
	["MarkNotificationReadedInput"]: ValueTypes["MarkNotificationReadedInput"];
	["PageOptionsInput"]: ValueTypes["PageOptionsInput"];
	["NotificationTargetType"]: ValueTypes["NotificationTargetType"];
	["SortDirection"]: ValueTypes["SortDirection"];
	["NotificationType"]: ValueTypes["NotificationType"];
	["Date"]: ValueTypes["Date"];
}