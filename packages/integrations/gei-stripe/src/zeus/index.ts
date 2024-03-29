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
type ZEUS_INTERFACES = never
export type ScalarCoders = {
	Timestamp?: ScalarResolver;
	AnyObject?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["Query"]: AliasType<{
products?: [{	filter?: ValueTypes["ProductFilter"] | undefined | null | Variable<any, string>},ValueTypes["ProductsPage"]],
subscriptions?: [{	filter?: ValueTypes["SubscriptionFilter"] | undefined | null | Variable<any, string>},ValueTypes["Subscription"]],
paymentIntents?: [{	filter: ValueTypes["PaymentIntentFilter"] | Variable<any, string>},ValueTypes["PaymentIntent"]],
invoices?: [{	filter: ValueTypes["InvoiceFilter"] | Variable<any, string>},ValueTypes["Invoice"]],
customer?: [{	customerId: string | Variable<any, string>},ValueTypes["Customer"]],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
createPaymentSession?: [{	payload: ValueTypes["CreatePaymentSessionInput"] | Variable<any, string>},boolean | `@${string}`],
initStripeCustomer?: [{	initStripeCustomerInput: ValueTypes["InitStripeCustomerInput"] | Variable<any, string>},boolean | `@${string}`],
createCheckoutSession?: [{	payload: ValueTypes["CreateCheckoutSessionInput"] | Variable<any, string>},boolean | `@${string}`],
createNewUserCheckoutSession?: [{	payload: ValueTypes["CreateNewUserCheckoutSessionInput"] | Variable<any, string>},boolean | `@${string}`],
createCustomerPortal?: [{	payload: ValueTypes["CreateCustomerPortalInput"] | Variable<any, string>},boolean | `@${string}`],
createConnectAccount?: [{	payload: ValueTypes["CreateConnectAccountInput"] | Variable<any, string>},boolean | `@${string}`],
attachPaymentMethod?: [{	payload: ValueTypes["AttachPaymentMethodInput"] | Variable<any, string>},boolean | `@${string}`],
setDefaultPaymentMethod?: [{	payload: ValueTypes["setDefaultPaymentMethodInput"] | Variable<any, string>},boolean | `@${string}`],
createPayoutForConnectedAccount?: [{	payload: ValueTypes["createPayoutForConnectedAccountInput"] | Variable<any, string>},boolean | `@${string}`],
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreatePaymentSessionInput"]: {
	amount: number | Variable<any, string>,
	currency: string | Variable<any, string>,
	successUrl: string | Variable<any, string>,
	cancelUrl: string | Variable<any, string>,
	/** Default payment use type 'card' and 'blik' */
	payment_types?: Array<string> | undefined | null | Variable<any, string>
};
	["createPayoutForConnectedAccountInput"]: {
	/** If accountId is not specified, the default connected account is used. */
	accountId?: string | undefined | null | Variable<any, string>,
	amount: number | Variable<any, string>,
	currency: string | Variable<any, string>
};
	["PaymentIntentStatus"]:PaymentIntentStatus;
	["Invoice"]: AliasType<{
	id?:boolean | `@${string}`,
	account_country?:boolean | `@${string}`,
	account_name?:boolean | `@${string}`,
	account_tax_id?:boolean | `@${string}`,
	amount_due?:boolean | `@${string}`,
	amount_paid?:boolean | `@${string}`,
	amount_remaining?:boolean | `@${string}`,
	amount_shipping?:boolean | `@${string}`,
	application_fee_amount?:boolean | `@${string}`,
	attempt_count?:boolean | `@${string}`,
	attempted?:boolean | `@${string}`,
	auto_advance?:boolean | `@${string}`,
	billing_reason?:boolean | `@${string}`,
	/** ID of the latest charge generated for this invoice */
	charge?:boolean | `@${string}`,
	collection_method?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	/** ISO 4217 Currency codes */
	currency?:boolean | `@${string}`,
	customer?:boolean | `@${string}`,
	customer_address?:ValueTypes["Address"],
	customer_email?:boolean | `@${string}`,
	customer_name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	hosted_invoice_url?:boolean | `@${string}`,
	period_end?:boolean | `@${string}`,
	period_start?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	subscription?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InvoiceStatus"]:InvoiceStatus;
	["InvoiceCollectionMethod"]:InvoiceCollectionMethod;
	["PaymentIntent"]: AliasType<{
	id?:boolean | `@${string}`,
	client_secret?:boolean | `@${string}`,
	/** A positive integer representing how much to charge in the smallest currency unit (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency). */
	amount?:boolean | `@${string}`,
	amount_capturable?:boolean | `@${string}`,
	amount_received?:boolean | `@${string}`,
	application_fee_amount?:boolean | `@${string}`,
	capture_method?:boolean | `@${string}`,
	confirmation_method?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	/** Three-letter ISO currency code, in lowercase. Must be a supported currency. */
	currency?:boolean | `@${string}`,
	/** ID of the Customer this PaymentIntent belongs to */
	customer?:boolean | `@${string}`,
	/** An arbitrary string attached to the object. Often useful for displaying to users. */
	description?:boolean | `@${string}`,
	/** ID of the invoice that created this PaymentIntent, if it exists. */
	invoice?:boolean | `@${string}`,
	latest_charge?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	payment_method?:boolean | `@${string}`,
	setup_future_usage?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	/** A string that identifies the resulting payment as part of a group (for connected accounts).  */
	transfer_group?:boolean | `@${string}`,
	/** The payment error encountered in the previous PaymentIntent confirmation. It will be cleared if the PaymentIntent is later updated for any reason. */
	last_payment_error?:ValueTypes["PaymentIntentLastPaymentError"],
	/** The account (if any) for which the funds of the PaymentIntent are intended.  */
	on_behalf_of?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentIntentLastPaymentError"]: AliasType<{
	type?:boolean | `@${string}`,
	/** For card errors, the ID of the failed charge. */
	charge?:boolean | `@${string}`,
	/** For some errors that could be handled programmatically, a short string indicating the error code reported (https://stripe.com/docs/error-codes). */
	code?:boolean | `@${string}`,
	decline_code?:boolean | `@${string}`,
	doc_url?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	param?:boolean | `@${string}`,
	payment_method_type?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentIntentSetupFutureUsage"]:PaymentIntentSetupFutureUsage;
	["InvoiceFilter"]: {
	customerId: string | Variable<any, string>,
	status?: ValueTypes["InvoiceStatus"] | undefined | null | Variable<any, string>
};
	["PaymentIntentFilter"]: {
	customerId: string | Variable<any, string>,
	status?: ValueTypes["PaymentIntentStatus"] | undefined | null | Variable<any, string>
};
	["setDefaultPaymentMethodInput"]: {
	attachedPaymentMethodId: string | Variable<any, string>,
	customerId: string | Variable<any, string>
};
	["AttachPaymentMethodInput"]: {
	paymentMethodId: string | Variable<any, string>,
	customerId: string | Variable<any, string>
};
	["CreateConnectAccountInput"]: {
	type: ValueTypes["ConnectAccountType"] | Variable<any, string>,
	country: string | Variable<any, string>,
	email: string | Variable<any, string>,
	business_type: ValueTypes["ConnectAccountBusinessType"] | Variable<any, string>,
	bankAccount: ValueTypes["BankAccountInput"] | Variable<any, string>
};
	["ConnectAccountBusinessType"]:ConnectAccountBusinessType;
	["ConnectAccountType"]:ConnectAccountType;
	["BankAccountInput"]: {
	country: string | Variable<any, string>,
	/** Required supported currency for the country https://stripe.com/docs/payouts */
	currency: string | Variable<any, string>,
	/** IBAN account number */
	account_number: string | Variable<any, string>,
	/** Required when attaching the bank account to a Customer */
	account_holder_name: string | Variable<any, string>,
	account_holder_type: ValueTypes["BankAccountHolderType"] | Variable<any, string>
};
	["BankAccountHolderType"]:BankAccountHolderType;
	["SubscriptionFilter"]: {
	id?: string | undefined | null | Variable<any, string>,
	cancel_at_period_end?: boolean | undefined | null | Variable<any, string>,
	current_period_end?: ValueTypes["TimestampFilter"] | undefined | null | Variable<any, string>,
	current_period_start?: ValueTypes["TimestampFilter"] | undefined | null | Variable<any, string>,
	customer?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	items?: Array<string> | undefined | null | Variable<any, string>,
	quantity?: number | undefined | null | Variable<any, string>,
	status?: ValueTypes["SubStatus"] | undefined | null | Variable<any, string>
};
	["Subscription"]: AliasType<{
	id?:boolean | `@${string}`,
	cancel_at_period_end?:boolean | `@${string}`,
	current_period_end?:boolean | `@${string}`,
	current_period_start?:boolean | `@${string}`,
	customer?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	items?:ValueTypes["SubscriptionItems"],
	quantity?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SubStatus"]:SubStatus;
	["SubscriptionItems"]: AliasType<{
	data?:ValueTypes["Item"],
	has_more?:boolean | `@${string}`,
	total_count?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	object?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Item"]: AliasType<{
	id?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	price?:ValueTypes["Price"],
	quantity?:boolean | `@${string}`,
	subscription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	stripeId?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InitStripeCustomerInput"]: {
	email: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	phone?: string | undefined | null | Variable<any, string>,
	address?: ValueTypes["AddressInput"] | undefined | null | Variable<any, string>
};
	["CreateNewUserCheckoutSessionInput"]: {
	/** Return url after successful transaction */
	successUrl: string | Variable<any, string>,
	cancelUrl: string | Variable<any, string>,
	products: Array<ValueTypes["ProductInput"]> | Variable<any, string>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ValueTypes["ApplicationFeeInput"] | undefined | null | Variable<any, string>
};
	["CreateCheckoutSessionInput"]: {
	username: string | Variable<any, string>,
	/** Return url after successful transaction */
	successUrl: string | Variable<any, string>,
	cancelUrl: string | Variable<any, string>,
	products: Array<ValueTypes["ProductInput"]> | Variable<any, string>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ValueTypes["ApplicationFeeInput"] | undefined | null | Variable<any, string>
};
	["ApplicationFeeInput"]: {
	/** Value from 0-100 */
	feePercentage: number | Variable<any, string>,
	/** Connect Account (not stripe customer) id */
	connectAccountId: string | Variable<any, string>
};
	["ProductInput"]: {
	productId: string | Variable<any, string>,
	quantity: number | Variable<any, string>
};
	["CreateCustomerPortalInput"]: {
	username: string | Variable<any, string>,
	returnUrl: string | Variable<any, string>
};
	["AddressInput"]: {
	/** City, district, suburb, town, village, or ward. */
	city: string | Variable<any, string>,
	/** Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)). */
	country: string | Variable<any, string>,
	/** Address line 1 (e.g., street, block, PO Box, or company name). */
	line1: string | Variable<any, string>,
	/** Address line 2 (e.g., apartment, suite, unit, or building). */
	line2: string | Variable<any, string>,
	/** ZIP or postal code. */
	postal_code: string | Variable<any, string>,
	/** State, county, province, prefecture, or region. */
	state: string | Variable<any, string>
};
	["Customer"]: AliasType<{
	id?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	address?:ValueTypes["Address"],
	phone?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	invoicePrefix?:boolean | `@${string}`,
	paymentMethods?:ValueTypes["PaymentMethod"],
		__typename?: boolean | `@${string}`
}>;
	/** https://stripe.com/docs/api/payment_methods/object */
["PaymentMethod"]: AliasType<{
	id?:boolean | `@${string}`,
	billing_details?:ValueTypes["PaymentBillingDetails"],
	customer?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	card?:ValueTypes["Card"],
		__typename?: boolean | `@${string}`
}>;
	["Card"]: AliasType<{
	brand?:ValueTypes["Card"],
	checks?:ValueTypes["CardChecks"],
	country?:boolean | `@${string}`,
	exp_month?:boolean | `@${string}`,
	exp_year?:boolean | `@${string}`,
	fingerprint?:boolean | `@${string}`,
	funding?:boolean | `@${string}`,
	last4?:boolean | `@${string}`,
	networks?:ValueTypes["CardNetworks"],
	three_d_secure_usage?:ValueTypes["CardThreeDSecureUsage"],
		__typename?: boolean | `@${string}`
}>;
	["CardThreeDSecureUsage"]: AliasType<{
	supported?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CardNetworks"]: AliasType<{
	preferred?:boolean | `@${string}`,
	available?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CardChecks"]: AliasType<{
	address_line1_check?:boolean | `@${string}`,
	address_postal_code_check?:boolean | `@${string}`,
	cvc_check?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodType"]:PaymentMethodType;
	["PaymentBillingDetails"]: AliasType<{
	address?:ValueTypes["Address"],
	email?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	phone?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Address"]: AliasType<{
	city?:boolean | `@${string}`,
	country?:boolean | `@${string}`,
	line1?:boolean | `@${string}`,
	line2?:boolean | `@${string}`,
	postal_code?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductFilter"]: {
	active?: boolean | undefined | null | Variable<any, string>,
	created?: ValueTypes["TimestampFilter"] | undefined | null | Variable<any, string>,
	limit?: number | undefined | null | Variable<any, string>,
	shippable?: boolean | undefined | null | Variable<any, string>,
	ids?: Array<string> | undefined | null | Variable<any, string>,
	starting_after?: string | undefined | null | Variable<any, string>,
	ending_before?: string | undefined | null | Variable<any, string>,
	url?: string | undefined | null | Variable<any, string>
};
	["RecurringFilter"]: {
	interval?: ValueTypes["Interval"] | undefined | null | Variable<any, string>,
	usageType?: ValueTypes["UsageType"] | undefined | null | Variable<any, string>
};
	["PriceFilter"]: {
	active?: boolean | undefined | null | Variable<any, string>,
	currency?: string | undefined | null | Variable<any, string>,
	product?: string | undefined | null | Variable<any, string>,
	type?: ValueTypes["Type"] | undefined | null | Variable<any, string>,
	created?: ValueTypes["TimestampFilter"] | undefined | null | Variable<any, string>,
	limit?: number | undefined | null | Variable<any, string>,
	starting_after?: string | undefined | null | Variable<any, string>,
	ending_before?: string | undefined | null | Variable<any, string>,
	recurring?: ValueTypes["RecurringFilter"] | undefined | null | Variable<any, string>
};
	["Dimensions"]: AliasType<{
	height?:boolean | `@${string}`,
	length?:boolean | `@${string}`,
	weight?:boolean | `@${string}`,
	width?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Product"]: AliasType<{
	id?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	default_price?:ValueTypes["Price"],
	description?:boolean | `@${string}`,
	images?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	package_dimensions?:ValueTypes["Dimensions"],
	shippable?:boolean | `@${string}`,
	statement_descriptor?:boolean | `@${string}`,
	tax_code?:boolean | `@${string}`,
	unitLabel?:boolean | `@${string}`,
	updated?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	prices?:ValueTypes["Price"],
		__typename?: boolean | `@${string}`
}>;
	["BillingScheme"]:BillingScheme;
	/** Offset measured in seconds since Unix epoch. */
["Timestamp"]:unknown;
	["TimestampFilter"]: {
	Gt?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>,
	Gte?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>,
	Lt?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>,
	Lte?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>
};
	["CustomUnitAmount"]: AliasType<{
	maximum?:boolean | `@${string}`,
	minimum?:boolean | `@${string}`,
	preset?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Any value that can be represented as JSON object */
["AnyObject"]:unknown;
	["AggregateUsage"]:AggregateUsage;
	["Interval"]:Interval;
	["UsageType"]:UsageType;
	["PriceRecurring"]: AliasType<{
	aggregate_usage?:boolean | `@${string}`,
	interval?:boolean | `@${string}`,
	interval_count?:boolean | `@${string}`,
	usage_type?:boolean | `@${string}`,
	trial_period_days?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxBehaviour"]:TaxBehaviour;
	["TiersMode"]:TiersMode;
	["Round"]:Round;
	["TransformQuantity"]: AliasType<{
	divideBy?:boolean | `@${string}`,
	round?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Type"]:Type;
	["Price"]: AliasType<{
	id?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	billing_scheme?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	currency?:boolean | `@${string}`,
	custom_unit_amount?:ValueTypes["CustomUnitAmount"],
	livemode?:boolean | `@${string}`,
	lookup_key?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	nickname?:boolean | `@${string}`,
	product?:ValueTypes["Product"],
	recurring?:ValueTypes["PriceRecurring"],
	tax_behavior?:boolean | `@${string}`,
	tiers_mode?:boolean | `@${string}`,
	transform_quantity?:ValueTypes["TransformQuantity"],
	type?:boolean | `@${string}`,
	unit_amount?:boolean | `@${string}`,
	unit_amount_decimal?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductsPage"]: AliasType<{
	products?:ValueTypes["Product"],
	startingAfter?:boolean | `@${string}`,
	endingBefore?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>
  }

export type ResolverInputTypes = {
    ["Query"]: AliasType<{
products?: [{	filter?: ResolverInputTypes["ProductFilter"] | undefined | null},ResolverInputTypes["ProductsPage"]],
subscriptions?: [{	filter?: ResolverInputTypes["SubscriptionFilter"] | undefined | null},ResolverInputTypes["Subscription"]],
paymentIntents?: [{	filter: ResolverInputTypes["PaymentIntentFilter"]},ResolverInputTypes["PaymentIntent"]],
invoices?: [{	filter: ResolverInputTypes["InvoiceFilter"]},ResolverInputTypes["Invoice"]],
customer?: [{	customerId: string},ResolverInputTypes["Customer"]],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
createPaymentSession?: [{	payload: ResolverInputTypes["CreatePaymentSessionInput"]},boolean | `@${string}`],
initStripeCustomer?: [{	initStripeCustomerInput: ResolverInputTypes["InitStripeCustomerInput"]},boolean | `@${string}`],
createCheckoutSession?: [{	payload: ResolverInputTypes["CreateCheckoutSessionInput"]},boolean | `@${string}`],
createNewUserCheckoutSession?: [{	payload: ResolverInputTypes["CreateNewUserCheckoutSessionInput"]},boolean | `@${string}`],
createCustomerPortal?: [{	payload: ResolverInputTypes["CreateCustomerPortalInput"]},boolean | `@${string}`],
createConnectAccount?: [{	payload: ResolverInputTypes["CreateConnectAccountInput"]},boolean | `@${string}`],
attachPaymentMethod?: [{	payload: ResolverInputTypes["AttachPaymentMethodInput"]},boolean | `@${string}`],
setDefaultPaymentMethod?: [{	payload: ResolverInputTypes["setDefaultPaymentMethodInput"]},boolean | `@${string}`],
createPayoutForConnectedAccount?: [{	payload: ResolverInputTypes["createPayoutForConnectedAccountInput"]},boolean | `@${string}`],
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreatePaymentSessionInput"]: {
	amount: number,
	currency: string,
	successUrl: string,
	cancelUrl: string,
	/** Default payment use type 'card' and 'blik' */
	payment_types?: Array<string> | undefined | null
};
	["createPayoutForConnectedAccountInput"]: {
	/** If accountId is not specified, the default connected account is used. */
	accountId?: string | undefined | null,
	amount: number,
	currency: string
};
	["PaymentIntentStatus"]:PaymentIntentStatus;
	["Invoice"]: AliasType<{
	id?:boolean | `@${string}`,
	account_country?:boolean | `@${string}`,
	account_name?:boolean | `@${string}`,
	account_tax_id?:boolean | `@${string}`,
	amount_due?:boolean | `@${string}`,
	amount_paid?:boolean | `@${string}`,
	amount_remaining?:boolean | `@${string}`,
	amount_shipping?:boolean | `@${string}`,
	application_fee_amount?:boolean | `@${string}`,
	attempt_count?:boolean | `@${string}`,
	attempted?:boolean | `@${string}`,
	auto_advance?:boolean | `@${string}`,
	billing_reason?:boolean | `@${string}`,
	/** ID of the latest charge generated for this invoice */
	charge?:boolean | `@${string}`,
	collection_method?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	/** ISO 4217 Currency codes */
	currency?:boolean | `@${string}`,
	customer?:boolean | `@${string}`,
	customer_address?:ResolverInputTypes["Address"],
	customer_email?:boolean | `@${string}`,
	customer_name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	hosted_invoice_url?:boolean | `@${string}`,
	period_end?:boolean | `@${string}`,
	period_start?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	subscription?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InvoiceStatus"]:InvoiceStatus;
	["InvoiceCollectionMethod"]:InvoiceCollectionMethod;
	["PaymentIntent"]: AliasType<{
	id?:boolean | `@${string}`,
	client_secret?:boolean | `@${string}`,
	/** A positive integer representing how much to charge in the smallest currency unit (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency). */
	amount?:boolean | `@${string}`,
	amount_capturable?:boolean | `@${string}`,
	amount_received?:boolean | `@${string}`,
	application_fee_amount?:boolean | `@${string}`,
	capture_method?:boolean | `@${string}`,
	confirmation_method?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	/** Three-letter ISO currency code, in lowercase. Must be a supported currency. */
	currency?:boolean | `@${string}`,
	/** ID of the Customer this PaymentIntent belongs to */
	customer?:boolean | `@${string}`,
	/** An arbitrary string attached to the object. Often useful for displaying to users. */
	description?:boolean | `@${string}`,
	/** ID of the invoice that created this PaymentIntent, if it exists. */
	invoice?:boolean | `@${string}`,
	latest_charge?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	payment_method?:boolean | `@${string}`,
	setup_future_usage?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	/** A string that identifies the resulting payment as part of a group (for connected accounts).  */
	transfer_group?:boolean | `@${string}`,
	/** The payment error encountered in the previous PaymentIntent confirmation. It will be cleared if the PaymentIntent is later updated for any reason. */
	last_payment_error?:ResolverInputTypes["PaymentIntentLastPaymentError"],
	/** The account (if any) for which the funds of the PaymentIntent are intended.  */
	on_behalf_of?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentIntentLastPaymentError"]: AliasType<{
	type?:boolean | `@${string}`,
	/** For card errors, the ID of the failed charge. */
	charge?:boolean | `@${string}`,
	/** For some errors that could be handled programmatically, a short string indicating the error code reported (https://stripe.com/docs/error-codes). */
	code?:boolean | `@${string}`,
	decline_code?:boolean | `@${string}`,
	doc_url?:boolean | `@${string}`,
	message?:boolean | `@${string}`,
	param?:boolean | `@${string}`,
	payment_method_type?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentIntentSetupFutureUsage"]:PaymentIntentSetupFutureUsage;
	["InvoiceFilter"]: {
	customerId: string,
	status?: ResolverInputTypes["InvoiceStatus"] | undefined | null
};
	["PaymentIntentFilter"]: {
	customerId: string,
	status?: ResolverInputTypes["PaymentIntentStatus"] | undefined | null
};
	["setDefaultPaymentMethodInput"]: {
	attachedPaymentMethodId: string,
	customerId: string
};
	["AttachPaymentMethodInput"]: {
	paymentMethodId: string,
	customerId: string
};
	["CreateConnectAccountInput"]: {
	type: ResolverInputTypes["ConnectAccountType"],
	country: string,
	email: string,
	business_type: ResolverInputTypes["ConnectAccountBusinessType"],
	bankAccount: ResolverInputTypes["BankAccountInput"]
};
	["ConnectAccountBusinessType"]:ConnectAccountBusinessType;
	["ConnectAccountType"]:ConnectAccountType;
	["BankAccountInput"]: {
	country: string,
	/** Required supported currency for the country https://stripe.com/docs/payouts */
	currency: string,
	/** IBAN account number */
	account_number: string,
	/** Required when attaching the bank account to a Customer */
	account_holder_name: string,
	account_holder_type: ResolverInputTypes["BankAccountHolderType"]
};
	["BankAccountHolderType"]:BankAccountHolderType;
	["SubscriptionFilter"]: {
	id?: string | undefined | null,
	cancel_at_period_end?: boolean | undefined | null,
	current_period_end?: ResolverInputTypes["TimestampFilter"] | undefined | null,
	current_period_start?: ResolverInputTypes["TimestampFilter"] | undefined | null,
	customer?: string | undefined | null,
	description?: string | undefined | null,
	items?: Array<string> | undefined | null,
	quantity?: number | undefined | null,
	status?: ResolverInputTypes["SubStatus"] | undefined | null
};
	["Subscription"]: AliasType<{
	id?:boolean | `@${string}`,
	cancel_at_period_end?:boolean | `@${string}`,
	current_period_end?:boolean | `@${string}`,
	current_period_start?:boolean | `@${string}`,
	customer?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	items?:ResolverInputTypes["SubscriptionItems"],
	quantity?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SubStatus"]:SubStatus;
	["SubscriptionItems"]: AliasType<{
	data?:ResolverInputTypes["Item"],
	has_more?:boolean | `@${string}`,
	total_count?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	object?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Item"]: AliasType<{
	id?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	price?:ResolverInputTypes["Price"],
	quantity?:boolean | `@${string}`,
	subscription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	stripeId?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InitStripeCustomerInput"]: {
	email: string,
	name?: string | undefined | null,
	phone?: string | undefined | null,
	address?: ResolverInputTypes["AddressInput"] | undefined | null
};
	["CreateNewUserCheckoutSessionInput"]: {
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<ResolverInputTypes["ProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ResolverInputTypes["ApplicationFeeInput"] | undefined | null
};
	["CreateCheckoutSessionInput"]: {
	username: string,
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<ResolverInputTypes["ProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ResolverInputTypes["ApplicationFeeInput"] | undefined | null
};
	["ApplicationFeeInput"]: {
	/** Value from 0-100 */
	feePercentage: number,
	/** Connect Account (not stripe customer) id */
	connectAccountId: string
};
	["ProductInput"]: {
	productId: string,
	quantity: number
};
	["CreateCustomerPortalInput"]: {
	username: string,
	returnUrl: string
};
	["AddressInput"]: {
	/** City, district, suburb, town, village, or ward. */
	city: string,
	/** Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)). */
	country: string,
	/** Address line 1 (e.g., street, block, PO Box, or company name). */
	line1: string,
	/** Address line 2 (e.g., apartment, suite, unit, or building). */
	line2: string,
	/** ZIP or postal code. */
	postal_code: string,
	/** State, county, province, prefecture, or region. */
	state: string
};
	["Customer"]: AliasType<{
	id?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	address?:ResolverInputTypes["Address"],
	phone?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	invoicePrefix?:boolean | `@${string}`,
	paymentMethods?:ResolverInputTypes["PaymentMethod"],
		__typename?: boolean | `@${string}`
}>;
	/** https://stripe.com/docs/api/payment_methods/object */
["PaymentMethod"]: AliasType<{
	id?:boolean | `@${string}`,
	billing_details?:ResolverInputTypes["PaymentBillingDetails"],
	customer?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	card?:ResolverInputTypes["Card"],
		__typename?: boolean | `@${string}`
}>;
	["Card"]: AliasType<{
	brand?:ResolverInputTypes["Card"],
	checks?:ResolverInputTypes["CardChecks"],
	country?:boolean | `@${string}`,
	exp_month?:boolean | `@${string}`,
	exp_year?:boolean | `@${string}`,
	fingerprint?:boolean | `@${string}`,
	funding?:boolean | `@${string}`,
	last4?:boolean | `@${string}`,
	networks?:ResolverInputTypes["CardNetworks"],
	three_d_secure_usage?:ResolverInputTypes["CardThreeDSecureUsage"],
		__typename?: boolean | `@${string}`
}>;
	["CardThreeDSecureUsage"]: AliasType<{
	supported?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CardNetworks"]: AliasType<{
	preferred?:boolean | `@${string}`,
	available?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CardChecks"]: AliasType<{
	address_line1_check?:boolean | `@${string}`,
	address_postal_code_check?:boolean | `@${string}`,
	cvc_check?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PaymentMethodType"]:PaymentMethodType;
	["PaymentBillingDetails"]: AliasType<{
	address?:ResolverInputTypes["Address"],
	email?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	phone?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Address"]: AliasType<{
	city?:boolean | `@${string}`,
	country?:boolean | `@${string}`,
	line1?:boolean | `@${string}`,
	line2?:boolean | `@${string}`,
	postal_code?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductFilter"]: {
	active?: boolean | undefined | null,
	created?: ResolverInputTypes["TimestampFilter"] | undefined | null,
	limit?: number | undefined | null,
	shippable?: boolean | undefined | null,
	ids?: Array<string> | undefined | null,
	starting_after?: string | undefined | null,
	ending_before?: string | undefined | null,
	url?: string | undefined | null
};
	["RecurringFilter"]: {
	interval?: ResolverInputTypes["Interval"] | undefined | null,
	usageType?: ResolverInputTypes["UsageType"] | undefined | null
};
	["PriceFilter"]: {
	active?: boolean | undefined | null,
	currency?: string | undefined | null,
	product?: string | undefined | null,
	type?: ResolverInputTypes["Type"] | undefined | null,
	created?: ResolverInputTypes["TimestampFilter"] | undefined | null,
	limit?: number | undefined | null,
	starting_after?: string | undefined | null,
	ending_before?: string | undefined | null,
	recurring?: ResolverInputTypes["RecurringFilter"] | undefined | null
};
	["Dimensions"]: AliasType<{
	height?:boolean | `@${string}`,
	length?:boolean | `@${string}`,
	weight?:boolean | `@${string}`,
	width?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Product"]: AliasType<{
	id?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	default_price?:ResolverInputTypes["Price"],
	description?:boolean | `@${string}`,
	images?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	package_dimensions?:ResolverInputTypes["Dimensions"],
	shippable?:boolean | `@${string}`,
	statement_descriptor?:boolean | `@${string}`,
	tax_code?:boolean | `@${string}`,
	unitLabel?:boolean | `@${string}`,
	updated?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	prices?:ResolverInputTypes["Price"],
		__typename?: boolean | `@${string}`
}>;
	["BillingScheme"]:BillingScheme;
	/** Offset measured in seconds since Unix epoch. */
["Timestamp"]:unknown;
	["TimestampFilter"]: {
	Gt?: ResolverInputTypes["Timestamp"] | undefined | null,
	Gte?: ResolverInputTypes["Timestamp"] | undefined | null,
	Lt?: ResolverInputTypes["Timestamp"] | undefined | null,
	Lte?: ResolverInputTypes["Timestamp"] | undefined | null
};
	["CustomUnitAmount"]: AliasType<{
	maximum?:boolean | `@${string}`,
	minimum?:boolean | `@${string}`,
	preset?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Any value that can be represented as JSON object */
["AnyObject"]:unknown;
	["AggregateUsage"]:AggregateUsage;
	["Interval"]:Interval;
	["UsageType"]:UsageType;
	["PriceRecurring"]: AliasType<{
	aggregate_usage?:boolean | `@${string}`,
	interval?:boolean | `@${string}`,
	interval_count?:boolean | `@${string}`,
	usage_type?:boolean | `@${string}`,
	trial_period_days?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TaxBehaviour"]:TaxBehaviour;
	["TiersMode"]:TiersMode;
	["Round"]:Round;
	["TransformQuantity"]: AliasType<{
	divideBy?:boolean | `@${string}`,
	round?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Type"]:Type;
	["Price"]: AliasType<{
	id?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	billing_scheme?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	currency?:boolean | `@${string}`,
	custom_unit_amount?:ResolverInputTypes["CustomUnitAmount"],
	livemode?:boolean | `@${string}`,
	lookup_key?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	nickname?:boolean | `@${string}`,
	product?:ResolverInputTypes["Product"],
	recurring?:ResolverInputTypes["PriceRecurring"],
	tax_behavior?:boolean | `@${string}`,
	tiers_mode?:boolean | `@${string}`,
	transform_quantity?:ResolverInputTypes["TransformQuantity"],
	type?:boolean | `@${string}`,
	unit_amount?:boolean | `@${string}`,
	unit_amount_decimal?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductsPage"]: AliasType<{
	products?:ResolverInputTypes["Product"],
	startingAfter?:boolean | `@${string}`,
	endingBefore?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["schema"]: AliasType<{
	mutation?:ResolverInputTypes["Mutation"],
	query?:ResolverInputTypes["Query"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["Query"]: {
		products?: ModelTypes["ProductsPage"] | undefined,
	subscriptions?: Array<ModelTypes["Subscription"]> | undefined,
	paymentIntents?: Array<ModelTypes["PaymentIntent"]> | undefined,
	invoices?: Array<ModelTypes["Invoice"]> | undefined,
	customer?: ModelTypes["Customer"] | undefined
};
	["Mutation"]: {
		/** create session for simply payment */
	createPaymentSession: string,
	/** Creates stripe customer for further purchases, links with user "email" field in UserCollection */
	initStripeCustomer: boolean,
	/** Creates checkout for existing user (returns checkout url) */
	createCheckoutSession: string,
	/** Creates checkout without providing user data - it will be filled during payment */
	createNewUserCheckoutSession: string,
	/** Creates stripe customer portal (returns portal url) */
	createCustomerPortal: string,
	/** Create stripe connect external account for further transactions directly with banking account */
	createConnectAccount: boolean,
	/** Gather payment method id using Stripe.js or a pre-built solution like Stripe Elements */
	attachPaymentMethod: boolean,
	setDefaultPaymentMethod: boolean,
	/** Payment from stripe account to connected bank account */
	createPayoutForConnectedAccount: boolean,
	/** entry point for Weebhooks. */
	webhook?: string | undefined
};
	["CreatePaymentSessionInput"]: {
	amount: number,
	currency: string,
	successUrl: string,
	cancelUrl: string,
	/** Default payment use type 'card' and 'blik' */
	payment_types?: Array<string> | undefined
};
	["createPayoutForConnectedAccountInput"]: {
	/** If accountId is not specified, the default connected account is used. */
	accountId?: string | undefined,
	amount: number,
	currency: string
};
	["PaymentIntentStatus"]:PaymentIntentStatus;
	["Invoice"]: {
		id: string,
	account_country: string,
	account_name: string,
	account_tax_id?: string | undefined,
	amount_due: number,
	amount_paid: number,
	amount_remaining: number,
	amount_shipping: number,
	application_fee_amount: number,
	attempt_count: number,
	attempted: boolean,
	auto_advance: boolean,
	billing_reason: string,
	/** ID of the latest charge generated for this invoice */
	charge?: string | undefined,
	collection_method: ModelTypes["InvoiceCollectionMethod"],
	created: ModelTypes["Timestamp"],
	/** ISO 4217 Currency codes */
	currency: string,
	customer: string,
	customer_address?: ModelTypes["Address"] | undefined,
	customer_email: string,
	customer_name: string,
	description?: string | undefined,
	hosted_invoice_url: string,
	period_end: ModelTypes["Timestamp"],
	period_start: ModelTypes["Timestamp"],
	status: ModelTypes["InvoiceStatus"],
	subscription?: string | undefined,
	total: number
};
	["InvoiceStatus"]:InvoiceStatus;
	["InvoiceCollectionMethod"]:InvoiceCollectionMethod;
	["PaymentIntent"]: {
		id: string,
	client_secret: string,
	/** A positive integer representing how much to charge in the smallest currency unit (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency). */
	amount: number,
	amount_capturable: number,
	amount_received: number,
	application_fee_amount: number,
	capture_method: string,
	confirmation_method: string,
	created: ModelTypes["Timestamp"],
	/** Three-letter ISO currency code, in lowercase. Must be a supported currency. */
	currency: string,
	/** ID of the Customer this PaymentIntent belongs to */
	customer: string,
	/** An arbitrary string attached to the object. Often useful for displaying to users. */
	description: string,
	/** ID of the invoice that created this PaymentIntent, if it exists. */
	invoice?: string | undefined,
	latest_charge: string,
	livemode: boolean,
	payment_method: string,
	setup_future_usage: string,
	status: ModelTypes["PaymentIntentStatus"],
	/** A string that identifies the resulting payment as part of a group (for connected accounts).  */
	transfer_group: string,
	/** The payment error encountered in the previous PaymentIntent confirmation. It will be cleared if the PaymentIntent is later updated for any reason. */
	last_payment_error?: ModelTypes["PaymentIntentLastPaymentError"] | undefined,
	/** The account (if any) for which the funds of the PaymentIntent are intended.  */
	on_behalf_of?: string | undefined
};
	["PaymentIntentLastPaymentError"]: {
		type: string,
	/** For card errors, the ID of the failed charge. */
	charge?: string | undefined,
	/** For some errors that could be handled programmatically, a short string indicating the error code reported (https://stripe.com/docs/error-codes). */
	code?: string | undefined,
	decline_code?: string | undefined,
	doc_url?: string | undefined,
	message: string,
	param?: string | undefined,
	payment_method_type?: string | undefined
};
	["PaymentIntentSetupFutureUsage"]:PaymentIntentSetupFutureUsage;
	["InvoiceFilter"]: {
	customerId: string,
	status?: ModelTypes["InvoiceStatus"] | undefined
};
	["PaymentIntentFilter"]: {
	customerId: string,
	status?: ModelTypes["PaymentIntentStatus"] | undefined
};
	["setDefaultPaymentMethodInput"]: {
	attachedPaymentMethodId: string,
	customerId: string
};
	["AttachPaymentMethodInput"]: {
	paymentMethodId: string,
	customerId: string
};
	["CreateConnectAccountInput"]: {
	type: ModelTypes["ConnectAccountType"],
	country: string,
	email: string,
	business_type: ModelTypes["ConnectAccountBusinessType"],
	bankAccount: ModelTypes["BankAccountInput"]
};
	["ConnectAccountBusinessType"]:ConnectAccountBusinessType;
	["ConnectAccountType"]:ConnectAccountType;
	["BankAccountInput"]: {
	country: string,
	/** Required supported currency for the country https://stripe.com/docs/payouts */
	currency: string,
	/** IBAN account number */
	account_number: string,
	/** Required when attaching the bank account to a Customer */
	account_holder_name: string,
	account_holder_type: ModelTypes["BankAccountHolderType"]
};
	["BankAccountHolderType"]:BankAccountHolderType;
	["SubscriptionFilter"]: {
	id?: string | undefined,
	cancel_at_period_end?: boolean | undefined,
	current_period_end?: ModelTypes["TimestampFilter"] | undefined,
	current_period_start?: ModelTypes["TimestampFilter"] | undefined,
	customer?: string | undefined,
	description?: string | undefined,
	items?: Array<string> | undefined,
	quantity?: number | undefined,
	status?: ModelTypes["SubStatus"] | undefined
};
	["Subscription"]: {
		id: string,
	cancel_at_period_end: boolean,
	current_period_end: ModelTypes["Timestamp"],
	current_period_start: ModelTypes["Timestamp"],
	customer: string,
	description?: string | undefined,
	items: ModelTypes["SubscriptionItems"],
	quantity: number,
	status: ModelTypes["SubStatus"]
};
	["SubStatus"]:SubStatus;
	["SubscriptionItems"]: {
		data: Array<ModelTypes["Item"]>,
	has_more: boolean,
	total_count: number,
	url: string,
	object: string
};
	["Item"]: {
		id: string,
	created: ModelTypes["Timestamp"],
	metadata?: ModelTypes["AnyObject"] | undefined,
	price: ModelTypes["Price"],
	quantity: number,
	subscription: string
};
	["User"]: {
		stripeId?: string | undefined,
	email: string
};
	["InitStripeCustomerInput"]: {
	email: string,
	name?: string | undefined,
	phone?: string | undefined,
	address?: ModelTypes["AddressInput"] | undefined
};
	["CreateNewUserCheckoutSessionInput"]: {
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<ModelTypes["ProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ModelTypes["ApplicationFeeInput"] | undefined
};
	["CreateCheckoutSessionInput"]: {
	username: string,
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<ModelTypes["ProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ModelTypes["ApplicationFeeInput"] | undefined
};
	["ApplicationFeeInput"]: {
	/** Value from 0-100 */
	feePercentage: number,
	/** Connect Account (not stripe customer) id */
	connectAccountId: string
};
	["ProductInput"]: {
	productId: string,
	quantity: number
};
	["CreateCustomerPortalInput"]: {
	username: string,
	returnUrl: string
};
	["AddressInput"]: {
	/** City, district, suburb, town, village, or ward. */
	city: string,
	/** Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)). */
	country: string,
	/** Address line 1 (e.g., street, block, PO Box, or company name). */
	line1: string,
	/** Address line 2 (e.g., apartment, suite, unit, or building). */
	line2: string,
	/** ZIP or postal code. */
	postal_code: string,
	/** State, county, province, prefecture, or region. */
	state: string
};
	["Customer"]: {
		id: string,
	email: string,
	name?: string | undefined,
	address?: ModelTypes["Address"] | undefined,
	phone?: string | undefined,
	created: ModelTypes["Timestamp"],
	invoicePrefix?: string | undefined,
	paymentMethods?: Array<ModelTypes["PaymentMethod"]> | undefined
};
	/** https://stripe.com/docs/api/payment_methods/object */
["PaymentMethod"]: {
		id: string,
	billing_details: ModelTypes["PaymentBillingDetails"],
	customer: string,
	metadata: ModelTypes["AnyObject"],
	type: ModelTypes["PaymentMethodType"],
	created: ModelTypes["Timestamp"],
	livemode: boolean,
	card?: ModelTypes["Card"] | undefined
};
	["Card"]: {
		brand: ModelTypes["Card"],
	checks: ModelTypes["CardChecks"],
	country: string,
	exp_month: number,
	exp_year: number,
	fingerprint: string,
	funding: string,
	last4: string,
	networks: ModelTypes["CardNetworks"],
	three_d_secure_usage: ModelTypes["CardThreeDSecureUsage"]
};
	["CardThreeDSecureUsage"]: {
		supported: boolean
};
	["CardNetworks"]: {
		preferred?: string | undefined,
	available?: Array<string> | undefined
};
	["CardChecks"]: {
		address_line1_check: string,
	address_postal_code_check: string,
	cvc_check: string
};
	["PaymentMethodType"]:PaymentMethodType;
	["PaymentBillingDetails"]: {
		address?: ModelTypes["Address"] | undefined,
	email: string,
	name: string,
	phone?: string | undefined
};
	["Address"]: {
		city?: string | undefined,
	country?: string | undefined,
	line1?: string | undefined,
	line2?: string | undefined,
	postal_code?: string | undefined,
	state?: string | undefined
};
	["ProductFilter"]: {
	active?: boolean | undefined,
	created?: ModelTypes["TimestampFilter"] | undefined,
	limit?: number | undefined,
	shippable?: boolean | undefined,
	ids?: Array<string> | undefined,
	starting_after?: string | undefined,
	ending_before?: string | undefined,
	url?: string | undefined
};
	["RecurringFilter"]: {
	interval?: ModelTypes["Interval"] | undefined,
	usageType?: ModelTypes["UsageType"] | undefined
};
	["PriceFilter"]: {
	active?: boolean | undefined,
	currency?: string | undefined,
	product?: string | undefined,
	type?: ModelTypes["Type"] | undefined,
	created?: ModelTypes["TimestampFilter"] | undefined,
	limit?: number | undefined,
	starting_after?: string | undefined,
	ending_before?: string | undefined,
	recurring?: ModelTypes["RecurringFilter"] | undefined
};
	["Dimensions"]: {
		height?: number | undefined,
	length?: number | undefined,
	weight?: number | undefined,
	width?: number | undefined
};
	["Product"]: {
		id: string,
	active: boolean,
	created?: ModelTypes["Timestamp"] | undefined,
	default_price?: ModelTypes["Price"] | undefined,
	description?: string | undefined,
	images?: Array<string> | undefined,
	livemode?: boolean | undefined,
	metadata?: ModelTypes["AnyObject"] | undefined,
	name?: string | undefined,
	package_dimensions?: ModelTypes["Dimensions"] | undefined,
	shippable?: boolean | undefined,
	statement_descriptor?: string | undefined,
	tax_code?: string | undefined,
	unitLabel?: string | undefined,
	updated?: ModelTypes["Timestamp"] | undefined,
	url?: string | undefined,
	prices?: Array<ModelTypes["Price"]> | undefined
};
	["BillingScheme"]:BillingScheme;
	/** Offset measured in seconds since Unix epoch. */
["Timestamp"]:any;
	["TimestampFilter"]: {
	Gt?: ModelTypes["Timestamp"] | undefined,
	Gte?: ModelTypes["Timestamp"] | undefined,
	Lt?: ModelTypes["Timestamp"] | undefined,
	Lte?: ModelTypes["Timestamp"] | undefined
};
	["CustomUnitAmount"]: {
		maximum?: number | undefined,
	minimum?: number | undefined,
	preset?: number | undefined
};
	/** Any value that can be represented as JSON object */
["AnyObject"]:any;
	["AggregateUsage"]:AggregateUsage;
	["Interval"]:Interval;
	["UsageType"]:UsageType;
	["PriceRecurring"]: {
		aggregate_usage?: ModelTypes["AggregateUsage"] | undefined,
	interval?: ModelTypes["Interval"] | undefined,
	interval_count?: number | undefined,
	usage_type?: ModelTypes["UsageType"] | undefined,
	trial_period_days?: number | undefined
};
	["TaxBehaviour"]:TaxBehaviour;
	["TiersMode"]:TiersMode;
	["Round"]:Round;
	["TransformQuantity"]: {
		divideBy?: number | undefined,
	round?: ModelTypes["Round"] | undefined
};
	["Type"]:Type;
	["Price"]: {
		id: string,
	active?: boolean | undefined,
	billing_scheme?: ModelTypes["BillingScheme"] | undefined,
	created?: ModelTypes["Timestamp"] | undefined,
	currency?: string | undefined,
	custom_unit_amount?: ModelTypes["CustomUnitAmount"] | undefined,
	livemode?: boolean | undefined,
	lookup_key?: string | undefined,
	metadata?: ModelTypes["AnyObject"] | undefined,
	nickname?: string | undefined,
	product?: ModelTypes["Product"] | undefined,
	recurring?: ModelTypes["PriceRecurring"] | undefined,
	tax_behavior?: ModelTypes["TaxBehaviour"] | undefined,
	tiers_mode?: ModelTypes["TiersMode"] | undefined,
	transform_quantity?: ModelTypes["TransformQuantity"] | undefined,
	type?: ModelTypes["Type"] | undefined,
	unit_amount?: number | undefined,
	unit_amount_decimal?: string | undefined
};
	["ProductsPage"]: {
		products?: Array<ModelTypes["Product"]> | undefined,
	startingAfter?: string | undefined,
	endingBefore?: string | undefined
};
	["schema"]: {
	mutation?: ModelTypes["Mutation"] | undefined,
	query?: ModelTypes["Query"] | undefined
}
    }

export type GraphQLTypes = {
    ["Query"]: {
	__typename: "Query",
	products?: GraphQLTypes["ProductsPage"] | undefined,
	subscriptions?: Array<GraphQLTypes["Subscription"]> | undefined,
	paymentIntents?: Array<GraphQLTypes["PaymentIntent"]> | undefined,
	invoices?: Array<GraphQLTypes["Invoice"]> | undefined,
	customer?: GraphQLTypes["Customer"] | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	/** create session for simply payment */
	createPaymentSession: string,
	/** Creates stripe customer for further purchases, links with user "email" field in UserCollection */
	initStripeCustomer: boolean,
	/** Creates checkout for existing user (returns checkout url) */
	createCheckoutSession: string,
	/** Creates checkout without providing user data - it will be filled during payment */
	createNewUserCheckoutSession: string,
	/** Creates stripe customer portal (returns portal url) */
	createCustomerPortal: string,
	/** Create stripe connect external account for further transactions directly with banking account */
	createConnectAccount: boolean,
	/** Gather payment method id using Stripe.js or a pre-built solution like Stripe Elements */
	attachPaymentMethod: boolean,
	setDefaultPaymentMethod: boolean,
	/** Payment from stripe account to connected bank account */
	createPayoutForConnectedAccount: boolean,
	/** entry point for Weebhooks. */
	webhook?: string | undefined
};
	["CreatePaymentSessionInput"]: {
		amount: number,
	currency: string,
	successUrl: string,
	cancelUrl: string,
	/** Default payment use type 'card' and 'blik' */
	payment_types?: Array<string> | undefined
};
	["createPayoutForConnectedAccountInput"]: {
		/** If accountId is not specified, the default connected account is used. */
	accountId?: string | undefined,
	amount: number,
	currency: string
};
	["PaymentIntentStatus"]: PaymentIntentStatus;
	["Invoice"]: {
	__typename: "Invoice",
	id: string,
	account_country: string,
	account_name: string,
	account_tax_id?: string | undefined,
	amount_due: number,
	amount_paid: number,
	amount_remaining: number,
	amount_shipping: number,
	application_fee_amount: number,
	attempt_count: number,
	attempted: boolean,
	auto_advance: boolean,
	billing_reason: string,
	/** ID of the latest charge generated for this invoice */
	charge?: string | undefined,
	collection_method: GraphQLTypes["InvoiceCollectionMethod"],
	created: GraphQLTypes["Timestamp"],
	/** ISO 4217 Currency codes */
	currency: string,
	customer: string,
	customer_address?: GraphQLTypes["Address"] | undefined,
	customer_email: string,
	customer_name: string,
	description?: string | undefined,
	hosted_invoice_url: string,
	period_end: GraphQLTypes["Timestamp"],
	period_start: GraphQLTypes["Timestamp"],
	status: GraphQLTypes["InvoiceStatus"],
	subscription?: string | undefined,
	total: number
};
	["InvoiceStatus"]: InvoiceStatus;
	["InvoiceCollectionMethod"]: InvoiceCollectionMethod;
	["PaymentIntent"]: {
	__typename: "PaymentIntent",
	id: string,
	client_secret: string,
	/** A positive integer representing how much to charge in the smallest currency unit (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency). */
	amount: number,
	amount_capturable: number,
	amount_received: number,
	application_fee_amount: number,
	capture_method: string,
	confirmation_method: string,
	created: GraphQLTypes["Timestamp"],
	/** Three-letter ISO currency code, in lowercase. Must be a supported currency. */
	currency: string,
	/** ID of the Customer this PaymentIntent belongs to */
	customer: string,
	/** An arbitrary string attached to the object. Often useful for displaying to users. */
	description: string,
	/** ID of the invoice that created this PaymentIntent, if it exists. */
	invoice?: string | undefined,
	latest_charge: string,
	livemode: boolean,
	payment_method: string,
	setup_future_usage: string,
	status: GraphQLTypes["PaymentIntentStatus"],
	/** A string that identifies the resulting payment as part of a group (for connected accounts).  */
	transfer_group: string,
	/** The payment error encountered in the previous PaymentIntent confirmation. It will be cleared if the PaymentIntent is later updated for any reason. */
	last_payment_error?: GraphQLTypes["PaymentIntentLastPaymentError"] | undefined,
	/** The account (if any) for which the funds of the PaymentIntent are intended.  */
	on_behalf_of?: string | undefined
};
	["PaymentIntentLastPaymentError"]: {
	__typename: "PaymentIntentLastPaymentError",
	type: string,
	/** For card errors, the ID of the failed charge. */
	charge?: string | undefined,
	/** For some errors that could be handled programmatically, a short string indicating the error code reported (https://stripe.com/docs/error-codes). */
	code?: string | undefined,
	decline_code?: string | undefined,
	doc_url?: string | undefined,
	message: string,
	param?: string | undefined,
	payment_method_type?: string | undefined
};
	["PaymentIntentSetupFutureUsage"]: PaymentIntentSetupFutureUsage;
	["InvoiceFilter"]: {
		customerId: string,
	status?: GraphQLTypes["InvoiceStatus"] | undefined
};
	["PaymentIntentFilter"]: {
		customerId: string,
	status?: GraphQLTypes["PaymentIntentStatus"] | undefined
};
	["setDefaultPaymentMethodInput"]: {
		attachedPaymentMethodId: string,
	customerId: string
};
	["AttachPaymentMethodInput"]: {
		paymentMethodId: string,
	customerId: string
};
	["CreateConnectAccountInput"]: {
		type: GraphQLTypes["ConnectAccountType"],
	country: string,
	email: string,
	business_type: GraphQLTypes["ConnectAccountBusinessType"],
	bankAccount: GraphQLTypes["BankAccountInput"]
};
	["ConnectAccountBusinessType"]: ConnectAccountBusinessType;
	["ConnectAccountType"]: ConnectAccountType;
	["BankAccountInput"]: {
		country: string,
	/** Required supported currency for the country https://stripe.com/docs/payouts */
	currency: string,
	/** IBAN account number */
	account_number: string,
	/** Required when attaching the bank account to a Customer */
	account_holder_name: string,
	account_holder_type: GraphQLTypes["BankAccountHolderType"]
};
	["BankAccountHolderType"]: BankAccountHolderType;
	["SubscriptionFilter"]: {
		id?: string | undefined,
	cancel_at_period_end?: boolean | undefined,
	current_period_end?: GraphQLTypes["TimestampFilter"] | undefined,
	current_period_start?: GraphQLTypes["TimestampFilter"] | undefined,
	customer?: string | undefined,
	description?: string | undefined,
	items?: Array<string> | undefined,
	quantity?: number | undefined,
	status?: GraphQLTypes["SubStatus"] | undefined
};
	["Subscription"]: {
	__typename: "Subscription",
	id: string,
	cancel_at_period_end: boolean,
	current_period_end: GraphQLTypes["Timestamp"],
	current_period_start: GraphQLTypes["Timestamp"],
	customer: string,
	description?: string | undefined,
	items: GraphQLTypes["SubscriptionItems"],
	quantity: number,
	status: GraphQLTypes["SubStatus"]
};
	["SubStatus"]: SubStatus;
	["SubscriptionItems"]: {
	__typename: "SubscriptionItems",
	data: Array<GraphQLTypes["Item"]>,
	has_more: boolean,
	total_count: number,
	url: string,
	object: string
};
	["Item"]: {
	__typename: "Item",
	id: string,
	created: GraphQLTypes["Timestamp"],
	metadata?: GraphQLTypes["AnyObject"] | undefined,
	price: GraphQLTypes["Price"],
	quantity: number,
	subscription: string
};
	["User"]: {
	__typename: "User",
	stripeId?: string | undefined,
	email: string
};
	["InitStripeCustomerInput"]: {
		email: string,
	name?: string | undefined,
	phone?: string | undefined,
	address?: GraphQLTypes["AddressInput"] | undefined
};
	["CreateNewUserCheckoutSessionInput"]: {
		/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<GraphQLTypes["ProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: GraphQLTypes["ApplicationFeeInput"] | undefined
};
	["CreateCheckoutSessionInput"]: {
		username: string,
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<GraphQLTypes["ProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: GraphQLTypes["ApplicationFeeInput"] | undefined
};
	["ApplicationFeeInput"]: {
		/** Value from 0-100 */
	feePercentage: number,
	/** Connect Account (not stripe customer) id */
	connectAccountId: string
};
	["ProductInput"]: {
		productId: string,
	quantity: number
};
	["CreateCustomerPortalInput"]: {
		username: string,
	returnUrl: string
};
	["AddressInput"]: {
		/** City, district, suburb, town, village, or ward. */
	city: string,
	/** Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)). */
	country: string,
	/** Address line 1 (e.g., street, block, PO Box, or company name). */
	line1: string,
	/** Address line 2 (e.g., apartment, suite, unit, or building). */
	line2: string,
	/** ZIP or postal code. */
	postal_code: string,
	/** State, county, province, prefecture, or region. */
	state: string
};
	["Customer"]: {
	__typename: "Customer",
	id: string,
	email: string,
	name?: string | undefined,
	address?: GraphQLTypes["Address"] | undefined,
	phone?: string | undefined,
	created: GraphQLTypes["Timestamp"],
	invoicePrefix?: string | undefined,
	paymentMethods?: Array<GraphQLTypes["PaymentMethod"]> | undefined
};
	/** https://stripe.com/docs/api/payment_methods/object */
["PaymentMethod"]: {
	__typename: "PaymentMethod",
	id: string,
	billing_details: GraphQLTypes["PaymentBillingDetails"],
	customer: string,
	metadata: GraphQLTypes["AnyObject"],
	type: GraphQLTypes["PaymentMethodType"],
	created: GraphQLTypes["Timestamp"],
	livemode: boolean,
	card?: GraphQLTypes["Card"] | undefined
};
	["Card"]: {
	__typename: "Card",
	brand: GraphQLTypes["Card"],
	checks: GraphQLTypes["CardChecks"],
	country: string,
	exp_month: number,
	exp_year: number,
	fingerprint: string,
	funding: string,
	last4: string,
	networks: GraphQLTypes["CardNetworks"],
	three_d_secure_usage: GraphQLTypes["CardThreeDSecureUsage"]
};
	["CardThreeDSecureUsage"]: {
	__typename: "CardThreeDSecureUsage",
	supported: boolean
};
	["CardNetworks"]: {
	__typename: "CardNetworks",
	preferred?: string | undefined,
	available?: Array<string> | undefined
};
	["CardChecks"]: {
	__typename: "CardChecks",
	address_line1_check: string,
	address_postal_code_check: string,
	cvc_check: string
};
	["PaymentMethodType"]: PaymentMethodType;
	["PaymentBillingDetails"]: {
	__typename: "PaymentBillingDetails",
	address?: GraphQLTypes["Address"] | undefined,
	email: string,
	name: string,
	phone?: string | undefined
};
	["Address"]: {
	__typename: "Address",
	city?: string | undefined,
	country?: string | undefined,
	line1?: string | undefined,
	line2?: string | undefined,
	postal_code?: string | undefined,
	state?: string | undefined
};
	["ProductFilter"]: {
		active?: boolean | undefined,
	created?: GraphQLTypes["TimestampFilter"] | undefined,
	limit?: number | undefined,
	shippable?: boolean | undefined,
	ids?: Array<string> | undefined,
	starting_after?: string | undefined,
	ending_before?: string | undefined,
	url?: string | undefined
};
	["RecurringFilter"]: {
		interval?: GraphQLTypes["Interval"] | undefined,
	usageType?: GraphQLTypes["UsageType"] | undefined
};
	["PriceFilter"]: {
		active?: boolean | undefined,
	currency?: string | undefined,
	product?: string | undefined,
	type?: GraphQLTypes["Type"] | undefined,
	created?: GraphQLTypes["TimestampFilter"] | undefined,
	limit?: number | undefined,
	starting_after?: string | undefined,
	ending_before?: string | undefined,
	recurring?: GraphQLTypes["RecurringFilter"] | undefined
};
	["Dimensions"]: {
	__typename: "Dimensions",
	height?: number | undefined,
	length?: number | undefined,
	weight?: number | undefined,
	width?: number | undefined
};
	["Product"]: {
	__typename: "Product",
	id: string,
	active: boolean,
	created?: GraphQLTypes["Timestamp"] | undefined,
	default_price?: GraphQLTypes["Price"] | undefined,
	description?: string | undefined,
	images?: Array<string> | undefined,
	livemode?: boolean | undefined,
	metadata?: GraphQLTypes["AnyObject"] | undefined,
	name?: string | undefined,
	package_dimensions?: GraphQLTypes["Dimensions"] | undefined,
	shippable?: boolean | undefined,
	statement_descriptor?: string | undefined,
	tax_code?: string | undefined,
	unitLabel?: string | undefined,
	updated?: GraphQLTypes["Timestamp"] | undefined,
	url?: string | undefined,
	prices?: Array<GraphQLTypes["Price"]> | undefined
};
	["BillingScheme"]: BillingScheme;
	/** Offset measured in seconds since Unix epoch. */
["Timestamp"]: "scalar" & { name: "Timestamp" };
	["TimestampFilter"]: {
		Gt?: GraphQLTypes["Timestamp"] | undefined,
	Gte?: GraphQLTypes["Timestamp"] | undefined,
	Lt?: GraphQLTypes["Timestamp"] | undefined,
	Lte?: GraphQLTypes["Timestamp"] | undefined
};
	["CustomUnitAmount"]: {
	__typename: "CustomUnitAmount",
	maximum?: number | undefined,
	minimum?: number | undefined,
	preset?: number | undefined
};
	/** Any value that can be represented as JSON object */
["AnyObject"]: "scalar" & { name: "AnyObject" };
	["AggregateUsage"]: AggregateUsage;
	["Interval"]: Interval;
	["UsageType"]: UsageType;
	["PriceRecurring"]: {
	__typename: "PriceRecurring",
	aggregate_usage?: GraphQLTypes["AggregateUsage"] | undefined,
	interval?: GraphQLTypes["Interval"] | undefined,
	interval_count?: number | undefined,
	usage_type?: GraphQLTypes["UsageType"] | undefined,
	trial_period_days?: number | undefined
};
	["TaxBehaviour"]: TaxBehaviour;
	["TiersMode"]: TiersMode;
	["Round"]: Round;
	["TransformQuantity"]: {
	__typename: "TransformQuantity",
	divideBy?: number | undefined,
	round?: GraphQLTypes["Round"] | undefined
};
	["Type"]: Type;
	["Price"]: {
	__typename: "Price",
	id: string,
	active?: boolean | undefined,
	billing_scheme?: GraphQLTypes["BillingScheme"] | undefined,
	created?: GraphQLTypes["Timestamp"] | undefined,
	currency?: string | undefined,
	custom_unit_amount?: GraphQLTypes["CustomUnitAmount"] | undefined,
	livemode?: boolean | undefined,
	lookup_key?: string | undefined,
	metadata?: GraphQLTypes["AnyObject"] | undefined,
	nickname?: string | undefined,
	product?: GraphQLTypes["Product"] | undefined,
	recurring?: GraphQLTypes["PriceRecurring"] | undefined,
	tax_behavior?: GraphQLTypes["TaxBehaviour"] | undefined,
	tiers_mode?: GraphQLTypes["TiersMode"] | undefined,
	transform_quantity?: GraphQLTypes["TransformQuantity"] | undefined,
	type?: GraphQLTypes["Type"] | undefined,
	unit_amount?: number | undefined,
	unit_amount_decimal?: string | undefined
};
	["ProductsPage"]: {
	__typename: "ProductsPage",
	products?: Array<GraphQLTypes["Product"]> | undefined,
	startingAfter?: string | undefined,
	endingBefore?: string | undefined
}
    }
export const enum PaymentIntentStatus {
	requires_payment_method = "requires_payment_method",
	requires_confirmation = "requires_confirmation",
	requires_action = "requires_action",
	processing = "processing",
	requires_capture = "requires_capture",
	canceled = "canceled",
	succeeded = "succeeded"
}
export const enum InvoiceStatus {
	draft = "draft",
	open = "open",
	paid = "paid",
	uncollectible = "uncollectible",
	void = "void"
}
export const enum InvoiceCollectionMethod {
	charge_automatically = "charge_automatically",
	send_invoice = "send_invoice"
}
export const enum PaymentIntentSetupFutureUsage {
	on_session = "on_session",
	off_session = "off_session"
}
export const enum ConnectAccountBusinessType {
	company = "company",
	government_entity = "government_entity",
	individual = "individual",
	non_profit = "non_profit"
}
export const enum ConnectAccountType {
	standard = "standard",
	express = "express",
	custom = "custom"
}
export const enum BankAccountHolderType {
	individual = "individual",
	company = "company"
}
export const enum SubStatus {
	incomplete = "incomplete",
	incomplete_expired = "incomplete_expired",
	trialing = "trialing",
	active = "active",
	past_due = "past_due",
	canceled = "canceled",
	unpaid = "unpaid"
}
export const enum PaymentMethodType {
	acss_debit = "acss_debit",
	affirm = "affirm",
	afterpay_clearpay = "afterpay_clearpay",
	alipay = "alipay",
	au_becs_debit = "au_becs_debit",
	bacs_debit = "bacs_debit",
	bancontact = "bancontact",
	blik = "blik",
	boleto = "boleto",
	card = "card",
	card_present = "card_present",
	cashapp = "cashapp",
	customer_balance = "customer_balance",
	eps = "eps",
	fpx = "fpx",
	giropay = "giropay",
	grabpay = "grabpay",
	ideal = "ideal",
	interac_present = "interac_present",
	klarna = "klarna",
	konbini = "konbini",
	link = "link",
	oxxo = "oxxo",
	p24 = "p24",
	paynow = "paynow",
	paypal = "paypal",
	pix = "pix",
	promptpay = "promptpay",
	sepa_debit = "sepa_debit",
	sofort = "sofort",
	us_bank_account = "us_bank_account",
	wechat_pay = "wechat_pay",
	zip = "zip"
}
export const enum BillingScheme {
	PER_UNIT = "PER_UNIT",
	TIERED = "TIERED"
}
export const enum AggregateUsage {
	SUM = "SUM",
	LAST_DURING_PERIOD = "LAST_DURING_PERIOD",
	LAST_EVER = "LAST_EVER",
	MAX = "MAX"
}
export const enum Interval {
	MONTH = "MONTH",
	YEAR = "YEAR",
	WEEK = "WEEK",
	DAY = "DAY"
}
export const enum UsageType {
	METERED = "METERED",
	LICENSED = "LICENSED"
}
export const enum TaxBehaviour {
	INCLUSIVE = "INCLUSIVE",
	EXCLUSIVE = "EXCLUSIVE",
	UNSPECIFIED = "UNSPECIFIED"
}
export const enum TiersMode {
	GRADUATED = "GRADUATED",
	VOLUME = "VOLUME"
}
export const enum Round {
	UP = "UP",
	DOWN = "DOWN"
}
export const enum Type {
	RECURRING = "RECURRING",
	ONE_TIME = "ONE_TIME"
}

type ZEUS_VARIABLES = {
	["CreatePaymentSessionInput"]: ValueTypes["CreatePaymentSessionInput"];
	["createPayoutForConnectedAccountInput"]: ValueTypes["createPayoutForConnectedAccountInput"];
	["PaymentIntentStatus"]: ValueTypes["PaymentIntentStatus"];
	["InvoiceStatus"]: ValueTypes["InvoiceStatus"];
	["InvoiceCollectionMethod"]: ValueTypes["InvoiceCollectionMethod"];
	["PaymentIntentSetupFutureUsage"]: ValueTypes["PaymentIntentSetupFutureUsage"];
	["InvoiceFilter"]: ValueTypes["InvoiceFilter"];
	["PaymentIntentFilter"]: ValueTypes["PaymentIntentFilter"];
	["setDefaultPaymentMethodInput"]: ValueTypes["setDefaultPaymentMethodInput"];
	["AttachPaymentMethodInput"]: ValueTypes["AttachPaymentMethodInput"];
	["CreateConnectAccountInput"]: ValueTypes["CreateConnectAccountInput"];
	["ConnectAccountBusinessType"]: ValueTypes["ConnectAccountBusinessType"];
	["ConnectAccountType"]: ValueTypes["ConnectAccountType"];
	["BankAccountInput"]: ValueTypes["BankAccountInput"];
	["BankAccountHolderType"]: ValueTypes["BankAccountHolderType"];
	["SubscriptionFilter"]: ValueTypes["SubscriptionFilter"];
	["SubStatus"]: ValueTypes["SubStatus"];
	["InitStripeCustomerInput"]: ValueTypes["InitStripeCustomerInput"];
	["CreateNewUserCheckoutSessionInput"]: ValueTypes["CreateNewUserCheckoutSessionInput"];
	["CreateCheckoutSessionInput"]: ValueTypes["CreateCheckoutSessionInput"];
	["ApplicationFeeInput"]: ValueTypes["ApplicationFeeInput"];
	["ProductInput"]: ValueTypes["ProductInput"];
	["CreateCustomerPortalInput"]: ValueTypes["CreateCustomerPortalInput"];
	["AddressInput"]: ValueTypes["AddressInput"];
	["PaymentMethodType"]: ValueTypes["PaymentMethodType"];
	["ProductFilter"]: ValueTypes["ProductFilter"];
	["RecurringFilter"]: ValueTypes["RecurringFilter"];
	["PriceFilter"]: ValueTypes["PriceFilter"];
	["BillingScheme"]: ValueTypes["BillingScheme"];
	["Timestamp"]: ValueTypes["Timestamp"];
	["TimestampFilter"]: ValueTypes["TimestampFilter"];
	["AnyObject"]: ValueTypes["AnyObject"];
	["AggregateUsage"]: ValueTypes["AggregateUsage"];
	["Interval"]: ValueTypes["Interval"];
	["UsageType"]: ValueTypes["UsageType"];
	["TaxBehaviour"]: ValueTypes["TaxBehaviour"];
	["TiersMode"]: ValueTypes["TiersMode"];
	["Round"]: ValueTypes["Round"];
	["Type"]: ValueTypes["Type"];
}