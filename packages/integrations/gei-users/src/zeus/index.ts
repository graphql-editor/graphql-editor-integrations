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
type ZEUS_INTERFACES = GraphQLTypes["Node"]
export type ScalarCoders = {
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["Query"]: AliasType<{
	login?:ValueTypes["LoginQuery"],
	/** Check if the user is logged in from headers and return it */
	isUser?:ValueTypes["User"],
	mustBeUser?:ValueTypes["User"],
mustBeTeamMember?: [{	teamId: string | Variable<any, string>},ValueTypes["UserMember"]],
team?: [{	teamId: string | Variable<any, string>},ValueTypes["Team"]],
showTeamInvitations?: [{	sentFromMyTeam?: boolean | undefined | null | Variable<any, string>,	status?: ValueTypes["InvitationTeamStatus"] | undefined | null | Variable<any, string>},ValueTypes["InvitationTeamToken"]],
	showInviteTokens?:ValueTypes["InviteToken"],
getGoogleOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getMicrosoftOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getGithubOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getAppleOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
requestForForgotPassword?: [{	username: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["MustBeTeamMemberError"]:MustBeTeamMemberError;
	["UserMember"]: AliasType<{
	user?:ValueTypes["UserAuthType"],
	team?:ValueTypes["TeamAuthType"],
		__typename?: boolean | `@${string}`
}>;
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null | Variable<any, string>,
	state?: string | undefined | null | Variable<any, string>,
	redirectUri?: string | undefined | null | Variable<any, string>
};
	["Mutation"]: AliasType<{
register?: [{	user: ValueTypes["RegisterInput"] | Variable<any, string>},ValueTypes["RegisterResponse"]],
verifyEmail?: [{	verifyData: ValueTypes["VerifyEmailInput"] | Variable<any, string>},ValueTypes["VerifyEmailResponse"]],
changePasswordWhenLogged?: [{	changePasswordData: ValueTypes["ChangePasswordWhenLoggedInput"] | Variable<any, string>},ValueTypes["ChangePasswordWhenLoggedResponse"]],
changePasswordWithToken?: [{	token: ValueTypes["ChangePasswordWithTokenInput"] | Variable<any, string>},ValueTypes["ChangePasswordWithTokenResponse"]],
generateInviteToken?: [{	/** string format mm/dd/rrrr */
	tokenOptions: ValueTypes["InviteTokenInput"] | Variable<any, string>},ValueTypes["GenerateInviteTokenResponse"]],
deleteInvitation?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
removeUserFromTeam?: [{	data: ValueTypes["RemoveUserFromTeamInput"] | Variable<any, string>},ValueTypes["RemoveUserFromTeamResponse"]],
sendInvitationToTeam?: [{	invitation: ValueTypes["SendTeamInvitationInput"] | Variable<any, string>},ValueTypes["SendInvitationToTeamResponse"]],
joinToTeam?: [{	teamId: string | Variable<any, string>},ValueTypes["JoinToTeamResponse"]],
joinToTeamWithInvitationToken?: [{	token: string | Variable<any, string>},ValueTypes["JoinToTeamWithInvitationTokenResponse"]],
createTeam?: [{	teamName: string | Variable<any, string>},ValueTypes["CreateTeamResponse"]],
squashAccounts?: [{	password?: string | undefined | null | Variable<any, string>},ValueTypes["SquashAccountsResponse"]],
integrateSocialAccount?: [{	userData: ValueTypes["SimpleUserInput"] | Variable<any, string>},ValueTypes["IntegrateSocialAccountResponse"]],
generateOAuthToken?: [{	tokenData: ValueTypes["GenerateOAuthTokenInput"] | Variable<any, string>},ValueTypes["GenerateOAuthTokenResponse"]],
editUser?: [{	updatedUser: ValueTypes["UpdateUserInput"] | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GenerateInviteTokenError"]:GenerateInviteTokenError;
	["GenerateInviteTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RemoveUserFromTeamError"]:RemoveUserFromTeamError;
	["RemoveUserFromTeamResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SendInvitationToTeamError"]:SendInvitationToTeamError;
	["SendInvitationToTeamResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["JoinToTeamError"]:JoinToTeamError;
	["JoinToTeamResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateTeamError"]:CreateTeamError;
	["CreateTeamResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SquashAccountsError"]:SquashAccountsError;
	["SquashAccountsResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["JoinToTeamWithInvitationTokenError"]:JoinToTeamWithInvitationTokenError;
	["JoinToTeamWithInvitationTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RemoveUserFromTeamInput"]: {
	userId: string | Variable<any, string>,
	teamId: string | Variable<any, string>
};
	["UpdateUserInput"]: {
	username: string | Variable<any, string>
};
	["GenerateOAuthTokenInput"]: {
	social: ValueTypes["SocialKind"] | Variable<any, string>,
	code: string | Variable<any, string>
};
	["SimpleUserInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["LoginInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["SendTeamInvitationInput"]: {
	username: string | Variable<any, string>,
	teamId: string | Variable<any, string>
};
	["VerifyEmailInput"]: {
	token: string | Variable<any, string>
};
	["InviteTokenInput"]: {
	expires?: string | undefined | null | Variable<any, string>,
	domain?: string | undefined | null | Variable<any, string>,
	teamId?: string | undefined | null | Variable<any, string>
};
	["ChangePasswordWithTokenInput"]: {
	username: string | Variable<any, string>,
	forgotToken: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["ChangePasswordWhenLoggedInput"]: {
	username: string | Variable<any, string>,
	oldPassword: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["RegisterInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>,
	invitationToken?: string | undefined | null | Variable<any, string>
};
	["InvitationTeamToken"]: AliasType<{
	teamId?:boolean | `@${string}`,
	recipient?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	teamName?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InviteToken"]: AliasType<{
	token?:boolean | `@${string}`,
	expires?:boolean | `@${string}`,
	domain?:boolean | `@${string}`,
	owner?:boolean | `@${string}`,
	teamId?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Team"]: AliasType<{
	_id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	owner?:boolean | `@${string}`,
	members?:ValueTypes["TeamMember"],
		__typename?: boolean | `@${string}`
}>;
	["TeamAuthType"]: AliasType<{
	_id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	owner?:boolean | `@${string}`,
	members?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	teams?:ValueTypes["Team"],
	emailConfirmed?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UserAuthType"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	teams?:boolean | `@${string}`,
	emailConfirmed?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Social"]: AliasType<{
	_id?:boolean | `@${string}`,
	socialId?:boolean | `@${string}`,
	userId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InvitationTeamStatus"]:InvitationTeamStatus;
	["UserAuth"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	password?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SocialKind"]:SocialKind;
	["TeamMember"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Node"]:AliasType<{
		_id?:boolean | `@${string}`;
		['...on InvitationTeamToken']?: Omit<ValueTypes["InvitationTeamToken"],keyof ValueTypes["Node"]>;
		['...on InviteToken']?: Omit<ValueTypes["InviteToken"],keyof ValueTypes["Node"]>;
		['...on Team']?: Omit<ValueTypes["Team"],keyof ValueTypes["Node"]>;
		['...on TeamAuthType']?: Omit<ValueTypes["TeamAuthType"],keyof ValueTypes["Node"]>;
		['...on User']?: Omit<ValueTypes["User"],keyof ValueTypes["Node"]>;
		['...on Social']?: Omit<ValueTypes["Social"],keyof ValueTypes["Node"]>;
		['...on UserAuth']?: Omit<ValueTypes["UserAuth"],keyof ValueTypes["Node"]>;
		['...on TeamMember']?: Omit<ValueTypes["TeamMember"],keyof ValueTypes["Node"]>;
		__typename?: boolean | `@${string}`
}>;
	["LoginQuery"]: AliasType<{
password?: [{	user: ValueTypes["LoginInput"] | Variable<any, string>},ValueTypes["LoginResponse"]],
provider?: [{	params: ValueTypes["ProviderLoginInput"] | Variable<any, string>},ValueTypes["ProviderLoginQuery"]],
refreshToken?: [{	refreshToken: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginInput"]: {
	code: string | Variable<any, string>,
	redirectUri?: string | undefined | null | Variable<any, string>
};
	["ProviderLoginQuery"]: AliasType<{
	apple?:ValueTypes["ProviderResponse"],
	google?:ValueTypes["ProviderResponse"],
	github?:ValueTypes["ProviderResponse"],
	microsoft?:ValueTypes["ProviderResponse"],
		__typename?: boolean | `@${string}`
}>;
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: AliasType<{
	registered?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	providerAccessToken?:boolean | `@${string}`,
	/** field describes whether this is first login attempt for this username */
	register?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>
  }

export type ResolverInputTypes = {
    ["Query"]: AliasType<{
	login?:ResolverInputTypes["LoginQuery"],
	/** Check if the user is logged in from headers and return it */
	isUser?:ResolverInputTypes["User"],
	mustBeUser?:ResolverInputTypes["User"],
mustBeTeamMember?: [{	teamId: string},ResolverInputTypes["UserMember"]],
team?: [{	teamId: string},ResolverInputTypes["Team"]],
showTeamInvitations?: [{	sentFromMyTeam?: boolean | undefined | null,	status?: ResolverInputTypes["InvitationTeamStatus"] | undefined | null},ResolverInputTypes["InvitationTeamToken"]],
	showInviteTokens?:ResolverInputTypes["InviteToken"],
getGoogleOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getMicrosoftOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getGithubOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getAppleOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
requestForForgotPassword?: [{	username: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["MustBeTeamMemberError"]:MustBeTeamMemberError;
	["UserMember"]: AliasType<{
	user?:ResolverInputTypes["UserAuthType"],
	team?:ResolverInputTypes["TeamAuthType"],
		__typename?: boolean | `@${string}`
}>;
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null,
	state?: string | undefined | null,
	redirectUri?: string | undefined | null
};
	["Mutation"]: AliasType<{
register?: [{	user: ResolverInputTypes["RegisterInput"]},ResolverInputTypes["RegisterResponse"]],
verifyEmail?: [{	verifyData: ResolverInputTypes["VerifyEmailInput"]},ResolverInputTypes["VerifyEmailResponse"]],
changePasswordWhenLogged?: [{	changePasswordData: ResolverInputTypes["ChangePasswordWhenLoggedInput"]},ResolverInputTypes["ChangePasswordWhenLoggedResponse"]],
changePasswordWithToken?: [{	token: ResolverInputTypes["ChangePasswordWithTokenInput"]},ResolverInputTypes["ChangePasswordWithTokenResponse"]],
generateInviteToken?: [{	/** string format mm/dd/rrrr */
	tokenOptions: ResolverInputTypes["InviteTokenInput"]},ResolverInputTypes["GenerateInviteTokenResponse"]],
deleteInvitation?: [{	id: string},boolean | `@${string}`],
removeUserFromTeam?: [{	data: ResolverInputTypes["RemoveUserFromTeamInput"]},ResolverInputTypes["RemoveUserFromTeamResponse"]],
sendInvitationToTeam?: [{	invitation: ResolverInputTypes["SendTeamInvitationInput"]},ResolverInputTypes["SendInvitationToTeamResponse"]],
joinToTeam?: [{	teamId: string},ResolverInputTypes["JoinToTeamResponse"]],
joinToTeamWithInvitationToken?: [{	token: string},ResolverInputTypes["JoinToTeamWithInvitationTokenResponse"]],
createTeam?: [{	teamName: string},ResolverInputTypes["CreateTeamResponse"]],
squashAccounts?: [{	password?: string | undefined | null},ResolverInputTypes["SquashAccountsResponse"]],
integrateSocialAccount?: [{	userData: ResolverInputTypes["SimpleUserInput"]},ResolverInputTypes["IntegrateSocialAccountResponse"]],
generateOAuthToken?: [{	tokenData: ResolverInputTypes["GenerateOAuthTokenInput"]},ResolverInputTypes["GenerateOAuthTokenResponse"]],
editUser?: [{	updatedUser: ResolverInputTypes["UpdateUserInput"]},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GenerateInviteTokenError"]:GenerateInviteTokenError;
	["GenerateInviteTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RemoveUserFromTeamError"]:RemoveUserFromTeamError;
	["RemoveUserFromTeamResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SendInvitationToTeamError"]:SendInvitationToTeamError;
	["SendInvitationToTeamResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["JoinToTeamError"]:JoinToTeamError;
	["JoinToTeamResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateTeamError"]:CreateTeamError;
	["CreateTeamResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SquashAccountsError"]:SquashAccountsError;
	["SquashAccountsResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["JoinToTeamWithInvitationTokenError"]:JoinToTeamWithInvitationTokenError;
	["JoinToTeamWithInvitationTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RemoveUserFromTeamInput"]: {
	userId: string,
	teamId: string
};
	["UpdateUserInput"]: {
	username: string
};
	["GenerateOAuthTokenInput"]: {
	social: ResolverInputTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
	username: string,
	password: string
};
	["LoginInput"]: {
	username: string,
	password: string
};
	["SendTeamInvitationInput"]: {
	username: string,
	teamId: string
};
	["VerifyEmailInput"]: {
	token: string
};
	["InviteTokenInput"]: {
	expires?: string | undefined | null,
	domain?: string | undefined | null,
	teamId?: string | undefined | null
};
	["ChangePasswordWithTokenInput"]: {
	username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
	username: string,
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
	username: string,
	password: string,
	invitationToken?: string | undefined | null
};
	["InvitationTeamToken"]: AliasType<{
	teamId?:boolean | `@${string}`,
	recipient?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	teamName?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InviteToken"]: AliasType<{
	token?:boolean | `@${string}`,
	expires?:boolean | `@${string}`,
	domain?:boolean | `@${string}`,
	owner?:boolean | `@${string}`,
	teamId?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Team"]: AliasType<{
	_id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	owner?:boolean | `@${string}`,
	members?:ResolverInputTypes["TeamMember"],
		__typename?: boolean | `@${string}`
}>;
	["TeamAuthType"]: AliasType<{
	_id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	owner?:boolean | `@${string}`,
	members?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	teams?:ResolverInputTypes["Team"],
	emailConfirmed?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UserAuthType"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	teams?:boolean | `@${string}`,
	emailConfirmed?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Social"]: AliasType<{
	_id?:boolean | `@${string}`,
	socialId?:boolean | `@${string}`,
	userId?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InvitationTeamStatus"]:InvitationTeamStatus;
	["UserAuth"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	password?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SocialKind"]:SocialKind;
	["TeamMember"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Node"]:AliasType<{
		_id?:boolean | `@${string}`;
		['...on InvitationTeamToken']?: Omit<ResolverInputTypes["InvitationTeamToken"],keyof ResolverInputTypes["Node"]>;
		['...on InviteToken']?: Omit<ResolverInputTypes["InviteToken"],keyof ResolverInputTypes["Node"]>;
		['...on Team']?: Omit<ResolverInputTypes["Team"],keyof ResolverInputTypes["Node"]>;
		['...on TeamAuthType']?: Omit<ResolverInputTypes["TeamAuthType"],keyof ResolverInputTypes["Node"]>;
		['...on User']?: Omit<ResolverInputTypes["User"],keyof ResolverInputTypes["Node"]>;
		['...on Social']?: Omit<ResolverInputTypes["Social"],keyof ResolverInputTypes["Node"]>;
		['...on UserAuth']?: Omit<ResolverInputTypes["UserAuth"],keyof ResolverInputTypes["Node"]>;
		['...on TeamMember']?: Omit<ResolverInputTypes["TeamMember"],keyof ResolverInputTypes["Node"]>;
		__typename?: boolean | `@${string}`
}>;
	["LoginQuery"]: AliasType<{
password?: [{	user: ResolverInputTypes["LoginInput"]},ResolverInputTypes["LoginResponse"]],
provider?: [{	params: ResolverInputTypes["ProviderLoginInput"]},ResolverInputTypes["ProviderLoginQuery"]],
refreshToken?: [{	refreshToken: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginInput"]: {
	code: string,
	redirectUri?: string | undefined | null
};
	["ProviderLoginQuery"]: AliasType<{
	apple?:ResolverInputTypes["ProviderResponse"],
	google?:ResolverInputTypes["ProviderResponse"],
	github?:ResolverInputTypes["ProviderResponse"],
	microsoft?:ResolverInputTypes["ProviderResponse"],
		__typename?: boolean | `@${string}`
}>;
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: AliasType<{
	registered?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	providerAccessToken?:boolean | `@${string}`,
	/** field describes whether this is first login attempt for this username */
	register?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["Query"]: {
		login: ModelTypes["LoginQuery"],
	/** Check if the user is logged in from headers and return it */
	isUser?: ModelTypes["User"] | undefined,
	mustBeUser?: ModelTypes["User"] | undefined,
	mustBeTeamMember: ModelTypes["UserMember"],
	team?: ModelTypes["Team"] | undefined,
	showTeamInvitations: Array<ModelTypes["InvitationTeamToken"]>,
	showInviteTokens: Array<ModelTypes["InviteToken"]>,
	getGoogleOAuthLink: string,
	getMicrosoftOAuthLink: string,
	getGithubOAuthLink: string,
	getAppleOAuthLink: string,
	requestForForgotPassword: boolean
};
	["MustBeTeamMemberError"]:MustBeTeamMemberError;
	["UserMember"]: {
		user: ModelTypes["UserAuthType"],
	team: ModelTypes["TeamAuthType"]
};
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined,
	state?: string | undefined,
	redirectUri?: string | undefined
};
	["Mutation"]: {
		/** user */
	register: ModelTypes["RegisterResponse"],
	verifyEmail: ModelTypes["VerifyEmailResponse"],
	changePasswordWhenLogged: ModelTypes["ChangePasswordWhenLoggedResponse"],
	changePasswordWithToken: ModelTypes["ChangePasswordWithTokenResponse"],
	generateInviteToken: ModelTypes["GenerateInviteTokenResponse"],
	deleteInvitation: boolean,
	removeUserFromTeam: ModelTypes["RemoveUserFromTeamResponse"],
	sendInvitationToTeam: ModelTypes["SendInvitationToTeamResponse"],
	joinToTeam: ModelTypes["JoinToTeamResponse"],
	joinToTeamWithInvitationToken: ModelTypes["JoinToTeamWithInvitationTokenResponse"],
	createTeam: ModelTypes["CreateTeamResponse"],
	squashAccounts: ModelTypes["SquashAccountsResponse"],
	integrateSocialAccount: ModelTypes["IntegrateSocialAccountResponse"],
	generateOAuthToken: ModelTypes["GenerateOAuthTokenResponse"],
	editUser: boolean
};
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["VerifyEmailError"] | undefined
};
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["ChangePasswordWhenLoggedError"] | undefined
};
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["ChangePasswordWithTokenError"] | undefined
};
	["GenerateInviteTokenError"]:GenerateInviteTokenError;
	["GenerateInviteTokenResponse"]: {
		result?: string | undefined,
	hasError?: ModelTypes["GenerateInviteTokenError"] | undefined
};
	["RemoveUserFromTeamError"]:RemoveUserFromTeamError;
	["RemoveUserFromTeamResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["GenerateInviteTokenError"] | undefined
};
	["SendInvitationToTeamError"]:SendInvitationToTeamError;
	["SendInvitationToTeamResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["SendInvitationToTeamError"] | undefined
};
	["JoinToTeamError"]:JoinToTeamError;
	["JoinToTeamResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["JoinToTeamError"] | undefined
};
	["CreateTeamError"]:CreateTeamError;
	["CreateTeamResponse"]: {
		result?: string | undefined,
	hasError?: ModelTypes["CreateTeamError"] | undefined
};
	["SquashAccountsError"]:SquashAccountsError;
	["SquashAccountsResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["SquashAccountsError"] | undefined
};
	["JoinToTeamWithInvitationTokenError"]:JoinToTeamWithInvitationTokenError;
	["JoinToTeamWithInvitationTokenResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["JoinToTeamWithInvitationTokenError"] | undefined
};
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["IntegrateSocialAccountError"] | undefined
};
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: {
		result?: string | undefined,
	hasError?: ModelTypes["GenerateOAuthTokenError"] | undefined
};
	["RemoveUserFromTeamInput"]: {
	userId: string,
	teamId: string
};
	["UpdateUserInput"]: {
	username: string
};
	["GenerateOAuthTokenInput"]: {
	social: ModelTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
	username: string,
	password: string
};
	["LoginInput"]: {
	username: string,
	password: string
};
	["SendTeamInvitationInput"]: {
	username: string,
	teamId: string
};
	["VerifyEmailInput"]: {
	token: string
};
	["InviteTokenInput"]: {
	expires?: string | undefined,
	domain?: string | undefined,
	teamId?: string | undefined
};
	["ChangePasswordWithTokenInput"]: {
	username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
	username: string,
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
	username: string,
	password: string,
	invitationToken?: string | undefined
};
	["InvitationTeamToken"]: {
		teamId: string,
	recipient: string,
	status: ModelTypes["InvitationTeamStatus"],
	_id: string,
	teamName: string
};
	["InviteToken"]: {
		token: string,
	expires: string,
	domain: string,
	owner: string,
	teamId?: string | undefined,
	_id: string
};
	["Team"]: {
		_id: string,
	name: string,
	owner?: string | undefined,
	members: Array<ModelTypes["TeamMember"]>
};
	["TeamAuthType"]: {
		_id: string,
	name: string,
	owner?: string | undefined,
	members: Array<string>
};
	["User"]: {
		_id: string,
	username: string,
	teams: Array<ModelTypes["Team"]>,
	emailConfirmed: boolean,
	createdAt?: string | undefined
};
	["UserAuthType"]: {
		_id: string,
	username: string,
	teams: Array<string>,
	emailConfirmed: boolean
};
	["Social"]: {
		_id: string,
	socialId: string,
	userId: string,
	createdAt?: string | undefined
};
	["InvitationTeamStatus"]:InvitationTeamStatus;
	["UserAuth"]: {
		_id: string,
	username: string,
	password?: string | undefined
};
	["SocialKind"]:SocialKind;
	["TeamMember"]: {
		_id: string,
	username: string
};
	["Node"]: ModelTypes["InvitationTeamToken"] | ModelTypes["InviteToken"] | ModelTypes["Team"] | ModelTypes["TeamAuthType"] | ModelTypes["User"] | ModelTypes["Social"] | ModelTypes["UserAuth"] | ModelTypes["TeamMember"];
	["LoginQuery"]: {
		password: ModelTypes["LoginResponse"],
	provider: ModelTypes["ProviderLoginQuery"],
	/** endpoint for refreshing accessToken based on refreshToken */
	refreshToken: string
};
	["ProviderLoginInput"]: {
	code: string,
	redirectUri?: string | undefined
};
	["ProviderLoginQuery"]: {
		apple?: ModelTypes["ProviderResponse"] | undefined,
	google?: ModelTypes["ProviderResponse"] | undefined,
	github?: ModelTypes["ProviderResponse"] | undefined,
	microsoft?: ModelTypes["ProviderResponse"] | undefined
};
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: {
		registered?: boolean | undefined,
	hasError?: ModelTypes["RegisterErrors"] | undefined
};
	["LoginResponse"]: {
		/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	hasError?: ModelTypes["LoginErrors"] | undefined
};
	["ProviderResponse"]: {
		/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	providerAccessToken?: string | undefined,
	/** field describes whether this is first login attempt for this username */
	register?: boolean | undefined,
	hasError?: ModelTypes["ProviderErrors"] | undefined
}
    }

export type GraphQLTypes = {
    ["Query"]: {
	__typename: "Query",
	login: GraphQLTypes["LoginQuery"],
	/** Check if the user is logged in from headers and return it */
	isUser?: GraphQLTypes["User"] | undefined,
	mustBeUser?: GraphQLTypes["User"] | undefined,
	mustBeTeamMember: GraphQLTypes["UserMember"],
	team?: GraphQLTypes["Team"] | undefined,
	showTeamInvitations: Array<GraphQLTypes["InvitationTeamToken"]>,
	showInviteTokens: Array<GraphQLTypes["InviteToken"]>,
	getGoogleOAuthLink: string,
	getMicrosoftOAuthLink: string,
	getGithubOAuthLink: string,
	getAppleOAuthLink: string,
	requestForForgotPassword: boolean
};
	["MustBeTeamMemberError"]: MustBeTeamMemberError;
	["UserMember"]: {
	__typename: "UserMember",
	user: GraphQLTypes["UserAuthType"],
	team: GraphQLTypes["TeamAuthType"]
};
	["GetOAuthInput"]: {
		scopes?: Array<string> | undefined,
	state?: string | undefined,
	redirectUri?: string | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	/** user */
	register: GraphQLTypes["RegisterResponse"],
	verifyEmail: GraphQLTypes["VerifyEmailResponse"],
	changePasswordWhenLogged: GraphQLTypes["ChangePasswordWhenLoggedResponse"],
	changePasswordWithToken: GraphQLTypes["ChangePasswordWithTokenResponse"],
	generateInviteToken: GraphQLTypes["GenerateInviteTokenResponse"],
	deleteInvitation: boolean,
	removeUserFromTeam: GraphQLTypes["RemoveUserFromTeamResponse"],
	sendInvitationToTeam: GraphQLTypes["SendInvitationToTeamResponse"],
	joinToTeam: GraphQLTypes["JoinToTeamResponse"],
	joinToTeamWithInvitationToken: GraphQLTypes["JoinToTeamWithInvitationTokenResponse"],
	createTeam: GraphQLTypes["CreateTeamResponse"],
	squashAccounts: GraphQLTypes["SquashAccountsResponse"],
	integrateSocialAccount: GraphQLTypes["IntegrateSocialAccountResponse"],
	generateOAuthToken: GraphQLTypes["GenerateOAuthTokenResponse"],
	editUser: boolean
};
	["VerifyEmailError"]: VerifyEmailError;
	["VerifyEmailResponse"]: {
	__typename: "VerifyEmailResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["VerifyEmailError"] | undefined
};
	["ChangePasswordWhenLoggedError"]: ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: {
	__typename: "ChangePasswordWhenLoggedResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["ChangePasswordWhenLoggedError"] | undefined
};
	["ChangePasswordWithTokenError"]: ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: {
	__typename: "ChangePasswordWithTokenResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["ChangePasswordWithTokenError"] | undefined
};
	["GenerateInviteTokenError"]: GenerateInviteTokenError;
	["GenerateInviteTokenResponse"]: {
	__typename: "GenerateInviteTokenResponse",
	result?: string | undefined,
	hasError?: GraphQLTypes["GenerateInviteTokenError"] | undefined
};
	["RemoveUserFromTeamError"]: RemoveUserFromTeamError;
	["RemoveUserFromTeamResponse"]: {
	__typename: "RemoveUserFromTeamResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["GenerateInviteTokenError"] | undefined
};
	["SendInvitationToTeamError"]: SendInvitationToTeamError;
	["SendInvitationToTeamResponse"]: {
	__typename: "SendInvitationToTeamResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["SendInvitationToTeamError"] | undefined
};
	["JoinToTeamError"]: JoinToTeamError;
	["JoinToTeamResponse"]: {
	__typename: "JoinToTeamResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["JoinToTeamError"] | undefined
};
	["CreateTeamError"]: CreateTeamError;
	["CreateTeamResponse"]: {
	__typename: "CreateTeamResponse",
	result?: string | undefined,
	hasError?: GraphQLTypes["CreateTeamError"] | undefined
};
	["SquashAccountsError"]: SquashAccountsError;
	["SquashAccountsResponse"]: {
	__typename: "SquashAccountsResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["SquashAccountsError"] | undefined
};
	["JoinToTeamWithInvitationTokenError"]: JoinToTeamWithInvitationTokenError;
	["JoinToTeamWithInvitationTokenResponse"]: {
	__typename: "JoinToTeamWithInvitationTokenResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["JoinToTeamWithInvitationTokenError"] | undefined
};
	["IntegrateSocialAccountError"]: IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: {
	__typename: "IntegrateSocialAccountResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["IntegrateSocialAccountError"] | undefined
};
	["GenerateOAuthTokenError"]: GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: {
	__typename: "GenerateOAuthTokenResponse",
	result?: string | undefined,
	hasError?: GraphQLTypes["GenerateOAuthTokenError"] | undefined
};
	["RemoveUserFromTeamInput"]: {
		userId: string,
	teamId: string
};
	["UpdateUserInput"]: {
		username: string
};
	["GenerateOAuthTokenInput"]: {
		social: GraphQLTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
		username: string,
	password: string
};
	["LoginInput"]: {
		username: string,
	password: string
};
	["SendTeamInvitationInput"]: {
		username: string,
	teamId: string
};
	["VerifyEmailInput"]: {
		token: string
};
	["InviteTokenInput"]: {
		expires?: string | undefined,
	domain?: string | undefined,
	teamId?: string | undefined
};
	["ChangePasswordWithTokenInput"]: {
		username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
		username: string,
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
		username: string,
	password: string,
	invitationToken?: string | undefined
};
	["InvitationTeamToken"]: {
	__typename: "InvitationTeamToken",
	teamId: string,
	recipient: string,
	status: GraphQLTypes["InvitationTeamStatus"],
	_id: string,
	teamName: string
};
	["InviteToken"]: {
	__typename: "InviteToken",
	token: string,
	expires: string,
	domain: string,
	owner: string,
	teamId?: string | undefined,
	_id: string
};
	["Team"]: {
	__typename: "Team",
	_id: string,
	name: string,
	owner?: string | undefined,
	members: Array<GraphQLTypes["TeamMember"]>
};
	["TeamAuthType"]: {
	__typename: "TeamAuthType",
	_id: string,
	name: string,
	owner?: string | undefined,
	members: Array<string>
};
	["User"]: {
	__typename: "User",
	_id: string,
	username: string,
	teams: Array<GraphQLTypes["Team"]>,
	emailConfirmed: boolean,
	createdAt?: string | undefined
};
	["UserAuthType"]: {
	__typename: "UserAuthType",
	_id: string,
	username: string,
	teams: Array<string>,
	emailConfirmed: boolean
};
	["Social"]: {
	__typename: "Social",
	_id: string,
	socialId: string,
	userId: string,
	createdAt?: string | undefined
};
	["InvitationTeamStatus"]: InvitationTeamStatus;
	["UserAuth"]: {
	__typename: "UserAuth",
	_id: string,
	username: string,
	password?: string | undefined
};
	["SocialKind"]: SocialKind;
	["TeamMember"]: {
	__typename: "TeamMember",
	_id: string,
	username: string
};
	["Node"]: {
	__typename:"InvitationTeamToken" | "InviteToken" | "Team" | "TeamAuthType" | "User" | "Social" | "UserAuth" | "TeamMember",
	_id: string
	['...on InvitationTeamToken']: '__union' & GraphQLTypes["InvitationTeamToken"];
	['...on InviteToken']: '__union' & GraphQLTypes["InviteToken"];
	['...on Team']: '__union' & GraphQLTypes["Team"];
	['...on TeamAuthType']: '__union' & GraphQLTypes["TeamAuthType"];
	['...on User']: '__union' & GraphQLTypes["User"];
	['...on Social']: '__union' & GraphQLTypes["Social"];
	['...on UserAuth']: '__union' & GraphQLTypes["UserAuth"];
	['...on TeamMember']: '__union' & GraphQLTypes["TeamMember"];
};
	["LoginQuery"]: {
	__typename: "LoginQuery",
	password: GraphQLTypes["LoginResponse"],
	provider: GraphQLTypes["ProviderLoginQuery"],
	/** endpoint for refreshing accessToken based on refreshToken */
	refreshToken: string
};
	["ProviderLoginInput"]: {
		code: string,
	redirectUri?: string | undefined
};
	["ProviderLoginQuery"]: {
	__typename: "ProviderLoginQuery",
	apple?: GraphQLTypes["ProviderResponse"] | undefined,
	google?: GraphQLTypes["ProviderResponse"] | undefined,
	github?: GraphQLTypes["ProviderResponse"] | undefined,
	microsoft?: GraphQLTypes["ProviderResponse"] | undefined
};
	["RegisterErrors"]: RegisterErrors;
	["LoginErrors"]: LoginErrors;
	["ProviderErrors"]: ProviderErrors;
	["RegisterResponse"]: {
	__typename: "RegisterResponse",
	registered?: boolean | undefined,
	hasError?: GraphQLTypes["RegisterErrors"] | undefined
};
	["LoginResponse"]: {
	__typename: "LoginResponse",
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	hasError?: GraphQLTypes["LoginErrors"] | undefined
};
	["ProviderResponse"]: {
	__typename: "ProviderResponse",
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	providerAccessToken?: string | undefined,
	/** field describes whether this is first login attempt for this username */
	register?: boolean | undefined,
	hasError?: GraphQLTypes["ProviderErrors"] | undefined
}
    }
export const enum MustBeTeamMemberError {
	USER_IS_NOT_A_TEAM_MEMBER = "USER_IS_NOT_A_TEAM_MEMBER",
	TEAM_DOES_NOT_EXIST = "TEAM_DOES_NOT_EXIST"
}
export const enum VerifyEmailError {
	TOKEN_CANNOT_BE_FOUND = "TOKEN_CANNOT_BE_FOUND"
}
export const enum ChangePasswordWhenLoggedError {
	CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = "CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL",
	OLD_PASSWORD_IS_INVALID = "OLD_PASSWORD_IS_INVALID",
	PASSWORD_WEAK = "PASSWORD_WEAK"
}
export const enum ChangePasswordWithTokenError {
	CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = "CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL",
	TOKEN_IS_INVALID = "TOKEN_IS_INVALID",
	PASSWORD_IS_TOO_WEAK = "PASSWORD_IS_TOO_WEAK"
}
export const enum GenerateInviteTokenError {
	YOU_ARE_NOT_THE_OWNER_OF_A_TEAM_OR_TEAM_DOES_NOT_EXIST = "YOU_ARE_NOT_THE_OWNER_OF_A_TEAM_OR_TEAM_DOES_NOT_EXIST"
}
export const enum RemoveUserFromTeamError {
	YOU_ARE_NOT_THE_OWNER_OF_A_TEAM_OR_TEAM_DOES_NOT_EXIST = "YOU_ARE_NOT_THE_OWNER_OF_A_TEAM_OR_TEAM_DOES_NOT_EXIST",
	YOU_CANNOT_KICK_YOURSELF_FROM_THE_TEAM = "YOU_CANNOT_KICK_YOURSELF_FROM_THE_TEAM",
	USER_NOT_FOUND = "USER_NOT_FOUND"
}
export const enum SendInvitationToTeamError {
	USER_ALREADY_HAS_YOUR_INVITATION = "USER_ALREADY_HAS_YOUR_INVITATION",
	YOU_CANNOT_SEND_INVITATION_TO_YOURSELF = "YOU_CANNOT_SEND_INVITATION_TO_YOURSELF",
	USER_IS_NOT_OWNER_OF_THE_TEAM = "USER_IS_NOT_OWNER_OF_THE_TEAM",
	CANNOT_FIND_USER = "CANNOT_FIND_USER",
	USERNAME_IS_TOO_AMBIGUOUS = "USERNAME_IS_TOO_AMBIGUOUS"
}
export const enum JoinToTeamError {
	TEAM_INVITATION_DOES_NOT_EXIST_OR_CAPTURED = "TEAM_INVITATION_DOES_NOT_EXIST_OR_CAPTURED",
	MEMBER_ALREADY_EXISTS_IN_THE_TEAM = "MEMBER_ALREADY_EXISTS_IN_THE_TEAM"
}
export const enum CreateTeamError {
	TEAM_NOT_CREATED = "TEAM_NOT_CREATED"
}
export const enum SquashAccountsError {
	YOU_HAVE_ONLY_ONE_ACCOUNT = "YOU_HAVE_ONLY_ONE_ACCOUNT",
	YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL = "YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL",
	INCORRECT_PASSWORD = "INCORRECT_PASSWORD"
}
export const enum JoinToTeamWithInvitationTokenError {
	INVITATION_TOKEN_NOT_FOUND = "INVITATION_TOKEN_NOT_FOUND",
	TEAM_IN_INVITATION_TOKEN_NOT_SPECIFIED = "TEAM_IN_INVITATION_TOKEN_NOT_SPECIFIED",
	MEMBER_ALREADY_EXISTS_IN_THE_TEAM = "MEMBER_ALREADY_EXISTS_IN_THE_TEAM",
	INVITATION_TOKEN_EXPIRED = "INVITATION_TOKEN_EXPIRED"
}
export const enum IntegrateSocialAccountError {
	YOU_HAVE_ONLY_ONE_ACCOUNT = "YOU_HAVE_ONLY_ONE_ACCOUNT",
	YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE = "YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE",
	INCORRECT_PASSWORD = "INCORRECT_PASSWORD",
	CANNOT_FIND_USER = "CANNOT_FIND_USER",
	YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL = "YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL"
}
export const enum GenerateOAuthTokenError {
	TOKEN_NOT_GENERATED = "TOKEN_NOT_GENERATED",
	CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE = "CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE"
}
export const enum InvitationTeamStatus {
	Waiting = "Waiting",
	Taken = "Taken"
}
export const enum SocialKind {
	Google = "Google",
	Github = "Github",
	Apple = "Apple",
	Microsoft = "Microsoft"
}
export const enum RegisterErrors {
	USERNAME_EXISTS = "USERNAME_EXISTS",
	PASSWORD_WEAK = "PASSWORD_WEAK",
	INVITE_DOMAIN_INCORRECT = "INVITE_DOMAIN_INCORRECT",
	LINK_EXPIRED = "LINK_EXPIRED",
	USERNAME_INVALID = "USERNAME_INVALID"
}
export const enum LoginErrors {
	CONFIRM_EMAIL_BEFOR_LOGIN = "CONFIRM_EMAIL_BEFOR_LOGIN",
	INVALID_LOGIN_OR_PASSWORD = "INVALID_LOGIN_OR_PASSWORD",
	CANNOT_FIND_CONNECTED_USER = "CANNOT_FIND_CONNECTED_USER",
	YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL = "YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL",
	UNEXPECTED_ERROR = "UNEXPECTED_ERROR"
}
export const enum ProviderErrors {
	CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN = "CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN",
	CANNOT_FIND_EMAIL_FOR_THIS_PROFIL = "CANNOT_FIND_EMAIL_FOR_THIS_PROFIL",
	CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE = "CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE",
	CODE_IS_NOT_EXIST_IN_ARGS = "CODE_IS_NOT_EXIST_IN_ARGS",
	CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN = "CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN",
	CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT = "CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT"
}

type ZEUS_VARIABLES = {
	["MustBeTeamMemberError"]: ValueTypes["MustBeTeamMemberError"];
	["GetOAuthInput"]: ValueTypes["GetOAuthInput"];
	["VerifyEmailError"]: ValueTypes["VerifyEmailError"];
	["ChangePasswordWhenLoggedError"]: ValueTypes["ChangePasswordWhenLoggedError"];
	["ChangePasswordWithTokenError"]: ValueTypes["ChangePasswordWithTokenError"];
	["GenerateInviteTokenError"]: ValueTypes["GenerateInviteTokenError"];
	["RemoveUserFromTeamError"]: ValueTypes["RemoveUserFromTeamError"];
	["SendInvitationToTeamError"]: ValueTypes["SendInvitationToTeamError"];
	["JoinToTeamError"]: ValueTypes["JoinToTeamError"];
	["CreateTeamError"]: ValueTypes["CreateTeamError"];
	["SquashAccountsError"]: ValueTypes["SquashAccountsError"];
	["JoinToTeamWithInvitationTokenError"]: ValueTypes["JoinToTeamWithInvitationTokenError"];
	["IntegrateSocialAccountError"]: ValueTypes["IntegrateSocialAccountError"];
	["GenerateOAuthTokenError"]: ValueTypes["GenerateOAuthTokenError"];
	["RemoveUserFromTeamInput"]: ValueTypes["RemoveUserFromTeamInput"];
	["UpdateUserInput"]: ValueTypes["UpdateUserInput"];
	["GenerateOAuthTokenInput"]: ValueTypes["GenerateOAuthTokenInput"];
	["SimpleUserInput"]: ValueTypes["SimpleUserInput"];
	["LoginInput"]: ValueTypes["LoginInput"];
	["SendTeamInvitationInput"]: ValueTypes["SendTeamInvitationInput"];
	["VerifyEmailInput"]: ValueTypes["VerifyEmailInput"];
	["InviteTokenInput"]: ValueTypes["InviteTokenInput"];
	["ChangePasswordWithTokenInput"]: ValueTypes["ChangePasswordWithTokenInput"];
	["ChangePasswordWhenLoggedInput"]: ValueTypes["ChangePasswordWhenLoggedInput"];
	["RegisterInput"]: ValueTypes["RegisterInput"];
	["InvitationTeamStatus"]: ValueTypes["InvitationTeamStatus"];
	["SocialKind"]: ValueTypes["SocialKind"];
	["ProviderLoginInput"]: ValueTypes["ProviderLoginInput"];
	["RegisterErrors"]: ValueTypes["RegisterErrors"];
	["LoginErrors"]: ValueTypes["LoginErrors"];
	["ProviderErrors"]: ValueTypes["ProviderErrors"];
}