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
	store?:ValueTypes["Store"],
stripeCustomerQueryOps?: [{	customerId: string | Variable<any, string>},ValueTypes["StripeCustomerQueryOps"]],
		__typename?: boolean | `@${string}`
}>;
	["StripeCustomerQueryOps"]: AliasType<{
	getCustomerInfo?:ValueTypes["StripeCustomer"],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
initStripeCustomer?: [{	initStripeCustomerInput: ValueTypes["InitStripeCustomerInput"] | Variable<any, string>},boolean | `@${string}`],
stripeCustomerMutationOps?: [{	customerId: string | Variable<any, string>},ValueTypes["StripeCustomerMutationOps"]],
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeCustomerMutationOps"]: AliasType<{
generateBillingPortal?: [{	returnUrl: string | Variable<any, string>},boolean | `@${string}`],
generateCheckoutSession?: [{	generateCheckoutSessionInput: ValueTypes["GenerateCheckoutSessionInput"] | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["GenerateCheckoutSessionInput"]: {
	productIds: Array<string> | Variable<any, string>,
	success_url: string | Variable<any, string>,
	cancel_url: string | Variable<any, string>
};
	["InitStripeCustomerInput"]: {
	email: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	phone?: string | undefined | null | Variable<any, string>,
	address?: ValueTypes["AddressInput"] | undefined | null | Variable<any, string>
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
	["StripeCustomer"]: AliasType<{
	customerId?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	address?:ValueTypes["Address"],
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
	startingAfter?: string | undefined | null | Variable<any, string>,
	endingBefore?: string | undefined | null | Variable<any, string>,
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
	startingAfter?: string | undefined | null | Variable<any, string>,
	endingBefore?: string | undefined | null | Variable<any, string>,
	recurring?: ValueTypes["RecurringFilter"] | undefined | null | Variable<any, string>
};
	["Store"]: AliasType<{
products?: [{	filter?: ValueTypes["ProductFilter"] | undefined | null | Variable<any, string>},ValueTypes["ProductsPage"]],
prices?: [{	filter?: ValueTypes["PriceFilter"] | undefined | null | Variable<any, string>},ValueTypes["PricesPage"]],
		__typename?: boolean | `@${string}`
}>;
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
	defaultPrice?:ValueTypes["Price"],
	description?:boolean | `@${string}`,
	images?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	packageDimensions?:ValueTypes["Dimensions"],
	shippable?:boolean | `@${string}`,
	statementDescriptor?:boolean | `@${string}`,
	taxCode?:boolean | `@${string}`,
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
	aggregateUsage?:boolean | `@${string}`,
	interval?:boolean | `@${string}`,
	intervalCount?:boolean | `@${string}`,
	usageType?:boolean | `@${string}`,
	trialPeriodDays?:boolean | `@${string}`,
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
	billingScheme?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	currency?:boolean | `@${string}`,
	customUnitAmount?:ValueTypes["CustomUnitAmount"],
	livemode?:boolean | `@${string}`,
	lookupKey?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	nickname?:boolean | `@${string}`,
	product?:ValueTypes["Product"],
	recurring?:ValueTypes["PriceRecurring"],
	taxBehavior?:boolean | `@${string}`,
	tiersMode?:boolean | `@${string}`,
	transformQuantity?:ValueTypes["TransformQuantity"],
	type?:boolean | `@${string}`,
	unitAmount?:boolean | `@${string}`,
	unitAmountDecimal?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductsPage"]: AliasType<{
	products?:ValueTypes["Product"],
	startingAfter?:boolean | `@${string}`,
	endingBefore?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PricesPage"]: AliasType<{
	products?:ValueTypes["Price"],
	startingAfter?:boolean | `@${string}`,
	endingBefore?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>
  }

export type ResolverInputTypes = {
    ["Query"]: AliasType<{
	store?:ResolverInputTypes["Store"],
stripeCustomerQueryOps?: [{	customerId: string},ResolverInputTypes["StripeCustomerQueryOps"]],
		__typename?: boolean | `@${string}`
}>;
	["StripeCustomerQueryOps"]: AliasType<{
	getCustomerInfo?:ResolverInputTypes["StripeCustomer"],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
initStripeCustomer?: [{	initStripeCustomerInput: ResolverInputTypes["InitStripeCustomerInput"]},boolean | `@${string}`],
stripeCustomerMutationOps?: [{	customerId: string},ResolverInputTypes["StripeCustomerMutationOps"]],
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeCustomerMutationOps"]: AliasType<{
generateBillingPortal?: [{	returnUrl: string},boolean | `@${string}`],
generateCheckoutSession?: [{	generateCheckoutSessionInput: ResolverInputTypes["GenerateCheckoutSessionInput"]},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["GenerateCheckoutSessionInput"]: {
	productIds: Array<string>,
	success_url: string,
	cancel_url: string
};
	["InitStripeCustomerInput"]: {
	email: string,
	name?: string | undefined | null,
	phone?: string | undefined | null,
	address?: ResolverInputTypes["AddressInput"] | undefined | null
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
	["StripeCustomer"]: AliasType<{
	customerId?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	address?:ResolverInputTypes["Address"],
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
	startingAfter?: string | undefined | null,
	endingBefore?: string | undefined | null,
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
	startingAfter?: string | undefined | null,
	endingBefore?: string | undefined | null,
	recurring?: ResolverInputTypes["RecurringFilter"] | undefined | null
};
	["Store"]: AliasType<{
products?: [{	filter?: ResolverInputTypes["ProductFilter"] | undefined | null},ResolverInputTypes["ProductsPage"]],
prices?: [{	filter?: ResolverInputTypes["PriceFilter"] | undefined | null},ResolverInputTypes["PricesPage"]],
		__typename?: boolean | `@${string}`
}>;
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
	defaultPrice?:ResolverInputTypes["Price"],
	description?:boolean | `@${string}`,
	images?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	packageDimensions?:ResolverInputTypes["Dimensions"],
	shippable?:boolean | `@${string}`,
	statementDescriptor?:boolean | `@${string}`,
	taxCode?:boolean | `@${string}`,
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
	aggregateUsage?:boolean | `@${string}`,
	interval?:boolean | `@${string}`,
	intervalCount?:boolean | `@${string}`,
	usageType?:boolean | `@${string}`,
	trialPeriodDays?:boolean | `@${string}`,
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
	billingScheme?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	currency?:boolean | `@${string}`,
	customUnitAmount?:ResolverInputTypes["CustomUnitAmount"],
	livemode?:boolean | `@${string}`,
	lookupKey?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	nickname?:boolean | `@${string}`,
	product?:ResolverInputTypes["Product"],
	recurring?:ResolverInputTypes["PriceRecurring"],
	taxBehavior?:boolean | `@${string}`,
	tiersMode?:boolean | `@${string}`,
	transformQuantity?:ResolverInputTypes["TransformQuantity"],
	type?:boolean | `@${string}`,
	unitAmount?:boolean | `@${string}`,
	unitAmountDecimal?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProductsPage"]: AliasType<{
	products?:ResolverInputTypes["Product"],
	startingAfter?:boolean | `@${string}`,
	endingBefore?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PricesPage"]: AliasType<{
	products?:ResolverInputTypes["Price"],
	startingAfter?:boolean | `@${string}`,
	endingBefore?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["Query"]: {
		store: ModelTypes["Store"],
	stripeCustomerQueryOps?: ModelTypes["StripeCustomerQueryOps"] | undefined
};
	["StripeCustomerQueryOps"]: {
		getCustomerInfo?: ModelTypes["StripeCustomer"] | undefined
};
	["Mutation"]: {
		initStripeCustomer: boolean,
	stripeCustomerMutationOps?: ModelTypes["StripeCustomerMutationOps"] | undefined,
	/** entry point for Weebhooks. */
	webhook?: string | undefined
};
	["StripeCustomerMutationOps"]: {
		generateBillingPortal?: string | undefined,
	generateCheckoutSession?: string | undefined
};
	["GenerateCheckoutSessionInput"]: {
	productIds: Array<string>,
	success_url: string,
	cancel_url: string
};
	["InitStripeCustomerInput"]: {
	email: string,
	name?: string | undefined,
	phone?: string | undefined,
	address?: ModelTypes["AddressInput"] | undefined
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
	["StripeCustomer"]: {
		customerId: string,
	email: string,
	name?: string | undefined,
	address?: ModelTypes["Address"] | undefined
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
	startingAfter?: string | undefined,
	endingBefore?: string | undefined,
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
	startingAfter?: string | undefined,
	endingBefore?: string | undefined,
	recurring?: ModelTypes["RecurringFilter"] | undefined
};
	["Store"]: {
		products?: ModelTypes["ProductsPage"] | undefined,
	prices?: ModelTypes["PricesPage"] | undefined
};
	["Dimensions"]: {
		height?: number | undefined,
	length?: number | undefined,
	weight?: number | undefined,
	width?: number | undefined
};
	["Product"]: {
		id: string,
	active?: boolean | undefined,
	created?: ModelTypes["Timestamp"] | undefined,
	defaultPrice?: ModelTypes["Price"] | undefined,
	description?: string | undefined,
	images?: Array<string> | undefined,
	livemode?: boolean | undefined,
	metadata?: ModelTypes["AnyObject"] | undefined,
	name?: string | undefined,
	packageDimensions?: ModelTypes["Dimensions"] | undefined,
	shippable?: boolean | undefined,
	statementDescriptor?: string | undefined,
	taxCode?: string | undefined,
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
		aggregateUsage?: ModelTypes["AggregateUsage"] | undefined,
	interval?: ModelTypes["Interval"] | undefined,
	intervalCount?: number | undefined,
	usageType?: ModelTypes["UsageType"] | undefined,
	trialPeriodDays?: number | undefined
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
	billingScheme?: ModelTypes["BillingScheme"] | undefined,
	created?: ModelTypes["Timestamp"] | undefined,
	currency?: string | undefined,
	customUnitAmount?: ModelTypes["CustomUnitAmount"] | undefined,
	livemode?: boolean | undefined,
	lookupKey?: string | undefined,
	metadata?: ModelTypes["AnyObject"] | undefined,
	nickname?: string | undefined,
	product?: ModelTypes["Product"] | undefined,
	recurring?: ModelTypes["PriceRecurring"] | undefined,
	taxBehavior?: ModelTypes["TaxBehaviour"] | undefined,
	tiersMode?: ModelTypes["TiersMode"] | undefined,
	transformQuantity?: ModelTypes["TransformQuantity"] | undefined,
	type?: ModelTypes["Type"] | undefined,
	unitAmount?: number | undefined,
	unitAmountDecimal?: string | undefined
};
	["ProductsPage"]: {
		products?: Array<ModelTypes["Product"]> | undefined,
	startingAfter?: string | undefined,
	endingBefore?: string | undefined
};
	["PricesPage"]: {
		products?: Array<ModelTypes["Price"]> | undefined,
	startingAfter?: string | undefined,
	endingBefore?: string | undefined
}
    }

export type GraphQLTypes = {
    ["Query"]: {
	__typename: "Query",
	store: GraphQLTypes["Store"],
	stripeCustomerQueryOps?: GraphQLTypes["StripeCustomerQueryOps"] | undefined
};
	["StripeCustomerQueryOps"]: {
	__typename: "StripeCustomerQueryOps",
	getCustomerInfo?: GraphQLTypes["StripeCustomer"] | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	initStripeCustomer: boolean,
	stripeCustomerMutationOps?: GraphQLTypes["StripeCustomerMutationOps"] | undefined,
	/** entry point for Weebhooks. */
	webhook?: string | undefined
};
	["StripeCustomerMutationOps"]: {
	__typename: "StripeCustomerMutationOps",
	generateBillingPortal?: string | undefined,
	generateCheckoutSession?: string | undefined
};
	["GenerateCheckoutSessionInput"]: {
		productIds: Array<string>,
	success_url: string,
	cancel_url: string
};
	["InitStripeCustomerInput"]: {
		email: string,
	name?: string | undefined,
	phone?: string | undefined,
	address?: GraphQLTypes["AddressInput"] | undefined
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
	["StripeCustomer"]: {
	__typename: "StripeCustomer",
	customerId: string,
	email: string,
	name?: string | undefined,
	address?: GraphQLTypes["Address"] | undefined
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
	startingAfter?: string | undefined,
	endingBefore?: string | undefined,
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
	startingAfter?: string | undefined,
	endingBefore?: string | undefined,
	recurring?: GraphQLTypes["RecurringFilter"] | undefined
};
	["Store"]: {
	__typename: "Store",
	products?: GraphQLTypes["ProductsPage"] | undefined,
	prices?: GraphQLTypes["PricesPage"] | undefined
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
	active?: boolean | undefined,
	created?: GraphQLTypes["Timestamp"] | undefined,
	defaultPrice?: GraphQLTypes["Price"] | undefined,
	description?: string | undefined,
	images?: Array<string> | undefined,
	livemode?: boolean | undefined,
	metadata?: GraphQLTypes["AnyObject"] | undefined,
	name?: string | undefined,
	packageDimensions?: GraphQLTypes["Dimensions"] | undefined,
	shippable?: boolean | undefined,
	statementDescriptor?: string | undefined,
	taxCode?: string | undefined,
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
	aggregateUsage?: GraphQLTypes["AggregateUsage"] | undefined,
	interval?: GraphQLTypes["Interval"] | undefined,
	intervalCount?: number | undefined,
	usageType?: GraphQLTypes["UsageType"] | undefined,
	trialPeriodDays?: number | undefined
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
	billingScheme?: GraphQLTypes["BillingScheme"] | undefined,
	created?: GraphQLTypes["Timestamp"] | undefined,
	currency?: string | undefined,
	customUnitAmount?: GraphQLTypes["CustomUnitAmount"] | undefined,
	livemode?: boolean | undefined,
	lookupKey?: string | undefined,
	metadata?: GraphQLTypes["AnyObject"] | undefined,
	nickname?: string | undefined,
	product?: GraphQLTypes["Product"] | undefined,
	recurring?: GraphQLTypes["PriceRecurring"] | undefined,
	taxBehavior?: GraphQLTypes["TaxBehaviour"] | undefined,
	tiersMode?: GraphQLTypes["TiersMode"] | undefined,
	transformQuantity?: GraphQLTypes["TransformQuantity"] | undefined,
	type?: GraphQLTypes["Type"] | undefined,
	unitAmount?: number | undefined,
	unitAmountDecimal?: string | undefined
};
	["ProductsPage"]: {
	__typename: "ProductsPage",
	products?: Array<GraphQLTypes["Product"]> | undefined,
	startingAfter?: string | undefined,
	endingBefore?: string | undefined
};
	["PricesPage"]: {
	__typename: "PricesPage",
	products?: Array<GraphQLTypes["Price"]> | undefined,
	startingAfter?: string | undefined,
	endingBefore?: string | undefined
}
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
	["GenerateCheckoutSessionInput"]: ValueTypes["GenerateCheckoutSessionInput"];
	["InitStripeCustomerInput"]: ValueTypes["InitStripeCustomerInput"];
	["AddressInput"]: ValueTypes["AddressInput"];
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