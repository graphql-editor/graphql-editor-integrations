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
type ZEUS_INTERFACES = GraphQLTypes["BookingsdbEssentials"]
export type ScalarCoders = {
	BookingsDate?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["UserQuery"]: AliasType<{
	randomQuery?:boolean | `@${string}`,
	bookingUserQuery?:ValueTypes["BookingsUserQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UserMutation"]: AliasType<{
	randomMutation?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	user?:ValueTypes["UserMutation"],
		__typename?: boolean | `@${string}`
}>;
	["PublicQuery"]: AliasType<{
	bookingPublicQuery?:ValueTypes["BookingsPublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["Query"]: AliasType<{
	user?:ValueTypes["UserQuery"],
	public?:ValueTypes["PublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsQuery"]: AliasType<{
	/** if used user query endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserQuery will throw error about malformed source */
	user?:ValueTypes["BookingsUserQuery"],
	public?:ValueTypes["BookingsPublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsUserQuery"]: AliasType<{
getSelfBooks?: [{	input?: ValueTypes["BookingsGetBooksInput"] | undefined | null | Variable<any, string>},ValueTypes["BookingsGetBooksRepsond"]],
getBookingsForService?: [{	input?: ValueTypes["BookingsGetBookingsForServiceInput"] | undefined | null | Variable<any, string>},ValueTypes["BookingsGetBookingsForServiceRespond"]],
getSelfServices?: [{	input?: ValueTypes["BookingsGetSelfServicesInput"] | undefined | null | Variable<any, string>},ValueTypes["BookingsGetSelfServicesRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["BookingsMutation"]: AliasType<{
	/** if used user mutation endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserMutation will throw error about malformed source */
	user?:ValueTypes["BookingsUserMutation"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsPublicQuery"]: AliasType<{
listServices?: [{	input?: ValueTypes["BookingsListServicesInput"] | undefined | null | Variable<any, string>},ValueTypes["BookingsListServicesRespond"]],
getService?: [{	serviceId: string | Variable<any, string>},ValueTypes["BookingsGetServiceRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["BookingsUserMutation"]: AliasType<{
registerService?: [{	input: ValueTypes["BookingsRegisterServiceInput"] | Variable<any, string>},ValueTypes["BookingsRegisterServiceRespond"]],
updateService?: [{	input: ValueTypes["BookingsUpdateServiceInput"] | Variable<any, string>,	serviceId: string | Variable<any, string>},ValueTypes["BookingsUpdateServiceRespond"]],
removeService?: [{	serviceId: string | Variable<any, string>},ValueTypes["BookingsRemoveServiceRespond"]],
bookService?: [{	input: ValueTypes["BookingsBookServiceInput"] | Variable<any, string>,	serviceId: string | Variable<any, string>},ValueTypes["BookingsBookServiceRespond"]],
respondOnServiceRequest?: [{	input: ValueTypes["BookingsRespondOnServiceRequestInput"] | Variable<any, string>},ValueTypes["BookingsRespondOnServiceRequestRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["BookingsGetBookingsForServiceInput"]: {
	page?: ValueTypes["BookingsPageOptionsInput"] | undefined | null | Variable<any, string>,
	filters?: ValueTypes["BookingsGetBookingsForServiceFiltersInput"] | undefined | null | Variable<any, string>
};
	["BookingsGetBookingsForServiceFiltersInput"]: {
	fromDate?: ValueTypes["BookingsDate"] | undefined | null | Variable<any, string>,
	toDate?: ValueTypes["BookingsDate"] | undefined | null | Variable<any, string>,
	bookerId?: string | undefined | null | Variable<any, string>,
	status?: ValueTypes["BookingsBookStatus"] | undefined | null | Variable<any, string>
};
	["BookingsGetBookingsForServiceRespond"]: AliasType<{
	books?:ValueTypes["BookingsBookingRecord"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsRespondOnServiceRequestInput"]: {
	bookId: string | Variable<any, string>,
	/** answer field cannot be PENDING, otherwise it will throw error */
	answer: ValueTypes["BookingsBookStatus"] | Variable<any, string>
};
	["BookingsGetSelfServicesInput"]: {
	page?: ValueTypes["BookingsPageOptionsInput"] | undefined | null | Variable<any, string>,
	filters?: ValueTypes["BookingsGetSelfServicesFiltersInput"] | undefined | null | Variable<any, string>
};
	["BookingsGetSelfServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined | null | Variable<any, string>,
	/** description is regex */
	description?: string | undefined | null | Variable<any, string>,
	fromDate?: ValueTypes["BookingsDate"] | undefined | null | Variable<any, string>,
	toDate?: ValueTypes["BookingsDate"] | undefined | null | Variable<any, string>
};
	["BookingsGetSelfServicesRespond"]: AliasType<{
	service?:ValueTypes["BookingsService"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsRespondOnServiceRequestRespond"]: AliasType<{
	status?:boolean | `@${string}`,
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsGetBooksInput"]: {
	page?: ValueTypes["BookingsPageOptionsInput"] | undefined | null | Variable<any, string>,
	filters?: ValueTypes["BookingsGetBooksFiltersInput"] | undefined | null | Variable<any, string>
};
	["BookingsGetBooksFiltersInput"]: {
	startDate: string | Variable<any, string>
};
	["BookingsListServicesInput"]: {
	page?: ValueTypes["BookingsPageOptionsInput"] | undefined | null | Variable<any, string>,
	filters?: ValueTypes["BookingsListServicesFiltersInput"] | undefined | null | Variable<any, string>
};
	["BookingsGetBooksRepsond"]: AliasType<{
	books?:ValueTypes["BookingsBookingRecord"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsListServicesRespond"]: AliasType<{
	services?:ValueTypes["BookingsService"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsGetServiceRespond"]: AliasType<{
	service?:ValueTypes["BookingsService"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsRegisterUserInput"]: {
	username: string | Variable<any, string>,
	email: string | Variable<any, string>,
	phone?: string | undefined | null | Variable<any, string>
};
	["BookingsRegisterServiceInput"]: {
	name: string | Variable<any, string>,
	description: string | Variable<any, string>,
	startDate: ValueTypes["BookingsDate"] | Variable<any, string>,
	time: number | Variable<any, string>,
	neededAccept?: boolean | undefined | null | Variable<any, string>,
	active?: boolean | undefined | null | Variable<any, string>
};
	["BookingsRegisterServiceRespond"]: AliasType<{
	service?:ValueTypes["BookingsService"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsUpdateServiceInput"]: {
	name?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	startDate?: ValueTypes["BookingsDate"] | undefined | null | Variable<any, string>,
	time: number | Variable<any, string>,
	active?: boolean | undefined | null | Variable<any, string>,
	neededAccept?: boolean | undefined | null | Variable<any, string>
};
	["BookingsUpdateServiceRespond"]: AliasType<{
	service?:ValueTypes["BookingsService"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsRemoveServiceRespond"]: AliasType<{
	removed?:boolean | `@${string}`,
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsBookServiceInput"]: {
	serviceId: string | Variable<any, string>,
	comments?: string | undefined | null | Variable<any, string>
};
	["BookingsBookServiceRespond"]: AliasType<{
	book?:ValueTypes["BookingsBookingRecord"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsUserServiceRespond"]: AliasType<{
	service?:ValueTypes["BookingsService"],
	error?:ValueTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsService"]: AliasType<{
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
	["BookingsBookingRecord"]: AliasType<{
	bookerId?:boolean | `@${string}`,
	service?:ValueTypes["BookingsService"],
	comments?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	answeredAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BookingsGlobalError"]: AliasType<{
	/** custom message of error */
	message?:boolean | `@${string}`,
	/** path is name of resolver on which we got error */
	path?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BookingsdbEssentials"]:AliasType<{
		_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`;
		['...on BookingsService']?: Omit<ValueTypes["BookingsService"],keyof ValueTypes["BookingsdbEssentials"]>;
		['...on BookingsBookingRecord']?: Omit<ValueTypes["BookingsBookingRecord"],keyof ValueTypes["BookingsdbEssentials"]>;
		__typename?: boolean | `@${string}`
}>;
	["BookingsPageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined | null | Variable<any, string>,
	/** count stating from 0 */
	page?: number | undefined | null | Variable<any, string>
};
	["BookingsListServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined | null | Variable<any, string>,
	/** description is regex */
	description?: string | undefined | null | Variable<any, string>,
	fromDate?: ValueTypes["BookingsDate"] | undefined | null | Variable<any, string>,
	toDate?: ValueTypes["BookingsDate"] | undefined | null | Variable<any, string>,
	ownerId?: string | undefined | null | Variable<any, string>
};
	["BookingsDate"]:unknown;
	["BookingsBookStatus"]:BookingsBookStatus;
	["BookingsServiceType"]:BookingsServiceType
  }

export type ResolverInputTypes = {
    ["UserQuery"]: AliasType<{
	randomQuery?:boolean | `@${string}`,
	bookingUserQuery?:ResolverInputTypes["BookingsUserQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UserMutation"]: AliasType<{
	randomMutation?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	user?:ResolverInputTypes["UserMutation"],
		__typename?: boolean | `@${string}`
}>;
	["PublicQuery"]: AliasType<{
	bookingPublicQuery?:ResolverInputTypes["BookingsPublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["Query"]: AliasType<{
	user?:ResolverInputTypes["UserQuery"],
	public?:ResolverInputTypes["PublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsQuery"]: AliasType<{
	/** if used user query endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserQuery will throw error about malformed source */
	user?:ResolverInputTypes["BookingsUserQuery"],
	public?:ResolverInputTypes["BookingsPublicQuery"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsUserQuery"]: AliasType<{
getSelfBooks?: [{	input?: ResolverInputTypes["BookingsGetBooksInput"] | undefined | null},ResolverInputTypes["BookingsGetBooksRepsond"]],
getBookingsForService?: [{	input?: ResolverInputTypes["BookingsGetBookingsForServiceInput"] | undefined | null},ResolverInputTypes["BookingsGetBookingsForServiceRespond"]],
getSelfServices?: [{	input?: ResolverInputTypes["BookingsGetSelfServicesInput"] | undefined | null},ResolverInputTypes["BookingsGetSelfServicesRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["BookingsMutation"]: AliasType<{
	/** if used user mutation endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserMutation will throw error about malformed source */
	user?:ResolverInputTypes["BookingsUserMutation"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsPublicQuery"]: AliasType<{
listServices?: [{	input?: ResolverInputTypes["BookingsListServicesInput"] | undefined | null},ResolverInputTypes["BookingsListServicesRespond"]],
getService?: [{	serviceId: string},ResolverInputTypes["BookingsGetServiceRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["BookingsUserMutation"]: AliasType<{
registerService?: [{	input: ResolverInputTypes["BookingsRegisterServiceInput"]},ResolverInputTypes["BookingsRegisterServiceRespond"]],
updateService?: [{	input: ResolverInputTypes["BookingsUpdateServiceInput"],	serviceId: string},ResolverInputTypes["BookingsUpdateServiceRespond"]],
removeService?: [{	serviceId: string},ResolverInputTypes["BookingsRemoveServiceRespond"]],
bookService?: [{	input: ResolverInputTypes["BookingsBookServiceInput"],	serviceId: string},ResolverInputTypes["BookingsBookServiceRespond"]],
respondOnServiceRequest?: [{	input: ResolverInputTypes["BookingsRespondOnServiceRequestInput"]},ResolverInputTypes["BookingsRespondOnServiceRequestRespond"]],
		__typename?: boolean | `@${string}`
}>;
	["BookingsGetBookingsForServiceInput"]: {
	page?: ResolverInputTypes["BookingsPageOptionsInput"] | undefined | null,
	filters?: ResolverInputTypes["BookingsGetBookingsForServiceFiltersInput"] | undefined | null
};
	["BookingsGetBookingsForServiceFiltersInput"]: {
	fromDate?: ResolverInputTypes["BookingsDate"] | undefined | null,
	toDate?: ResolverInputTypes["BookingsDate"] | undefined | null,
	bookerId?: string | undefined | null,
	status?: ResolverInputTypes["BookingsBookStatus"] | undefined | null
};
	["BookingsGetBookingsForServiceRespond"]: AliasType<{
	books?:ResolverInputTypes["BookingsBookingRecord"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsRespondOnServiceRequestInput"]: {
	bookId: string,
	/** answer field cannot be PENDING, otherwise it will throw error */
	answer: ResolverInputTypes["BookingsBookStatus"]
};
	["BookingsGetSelfServicesInput"]: {
	page?: ResolverInputTypes["BookingsPageOptionsInput"] | undefined | null,
	filters?: ResolverInputTypes["BookingsGetSelfServicesFiltersInput"] | undefined | null
};
	["BookingsGetSelfServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined | null,
	/** description is regex */
	description?: string | undefined | null,
	fromDate?: ResolverInputTypes["BookingsDate"] | undefined | null,
	toDate?: ResolverInputTypes["BookingsDate"] | undefined | null
};
	["BookingsGetSelfServicesRespond"]: AliasType<{
	service?:ResolverInputTypes["BookingsService"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsRespondOnServiceRequestRespond"]: AliasType<{
	status?:boolean | `@${string}`,
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsGetBooksInput"]: {
	page?: ResolverInputTypes["BookingsPageOptionsInput"] | undefined | null,
	filters?: ResolverInputTypes["BookingsGetBooksFiltersInput"] | undefined | null
};
	["BookingsGetBooksFiltersInput"]: {
	startDate: string
};
	["BookingsListServicesInput"]: {
	page?: ResolverInputTypes["BookingsPageOptionsInput"] | undefined | null,
	filters?: ResolverInputTypes["BookingsListServicesFiltersInput"] | undefined | null
};
	["BookingsGetBooksRepsond"]: AliasType<{
	books?:ResolverInputTypes["BookingsBookingRecord"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsListServicesRespond"]: AliasType<{
	services?:ResolverInputTypes["BookingsService"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsGetServiceRespond"]: AliasType<{
	service?:ResolverInputTypes["BookingsService"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsRegisterUserInput"]: {
	username: string,
	email: string,
	phone?: string | undefined | null
};
	["BookingsRegisterServiceInput"]: {
	name: string,
	description: string,
	startDate: ResolverInputTypes["BookingsDate"],
	time: number,
	neededAccept?: boolean | undefined | null,
	active?: boolean | undefined | null
};
	["BookingsRegisterServiceRespond"]: AliasType<{
	service?:ResolverInputTypes["BookingsService"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsUpdateServiceInput"]: {
	name?: string | undefined | null,
	description?: string | undefined | null,
	startDate?: ResolverInputTypes["BookingsDate"] | undefined | null,
	time: number,
	active?: boolean | undefined | null,
	neededAccept?: boolean | undefined | null
};
	["BookingsUpdateServiceRespond"]: AliasType<{
	service?:ResolverInputTypes["BookingsService"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsRemoveServiceRespond"]: AliasType<{
	removed?:boolean | `@${string}`,
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsBookServiceInput"]: {
	serviceId: string,
	comments?: string | undefined | null
};
	["BookingsBookServiceRespond"]: AliasType<{
	book?:ResolverInputTypes["BookingsBookingRecord"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsUserServiceRespond"]: AliasType<{
	service?:ResolverInputTypes["BookingsService"],
	error?:ResolverInputTypes["BookingsGlobalError"],
		__typename?: boolean | `@${string}`
}>;
	["BookingsService"]: AliasType<{
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
	["BookingsBookingRecord"]: AliasType<{
	bookerId?:boolean | `@${string}`,
	service?:ResolverInputTypes["BookingsService"],
	comments?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
	answeredAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BookingsGlobalError"]: AliasType<{
	/** custom message of error */
	message?:boolean | `@${string}`,
	/** path is name of resolver on which we got error */
	path?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["BookingsdbEssentials"]:AliasType<{
		_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`;
		['...on BookingsService']?: Omit<ResolverInputTypes["BookingsService"],keyof ResolverInputTypes["BookingsdbEssentials"]>;
		['...on BookingsBookingRecord']?: Omit<ResolverInputTypes["BookingsBookingRecord"],keyof ResolverInputTypes["BookingsdbEssentials"]>;
		__typename?: boolean | `@${string}`
}>;
	["BookingsPageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined | null,
	/** count stating from 0 */
	page?: number | undefined | null
};
	["BookingsListServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined | null,
	/** description is regex */
	description?: string | undefined | null,
	fromDate?: ResolverInputTypes["BookingsDate"] | undefined | null,
	toDate?: ResolverInputTypes["BookingsDate"] | undefined | null,
	ownerId?: string | undefined | null
};
	["BookingsDate"]:unknown;
	["BookingsBookStatus"]:BookingsBookStatus;
	["BookingsServiceType"]:BookingsServiceType
  }

export type ModelTypes = {
    ["UserQuery"]: {
		randomQuery: string,
	bookingUserQuery: ModelTypes["BookingsUserQuery"]
};
	["UserMutation"]: {
		randomMutation: string
};
	["Mutation"]: {
		user: ModelTypes["UserMutation"]
};
	["PublicQuery"]: {
		bookingPublicQuery: ModelTypes["BookingsPublicQuery"]
};
	["Query"]: {
		user: ModelTypes["UserQuery"],
	public: ModelTypes["PublicQuery"]
};
	["schema"]: {
	query?: ModelTypes["Query"] | undefined,
	mutation?: ModelTypes["Mutation"] | undefined
};
	["BookingsQuery"]: {
		/** if used user query endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserQuery will throw error about malformed source */
	user?: ModelTypes["BookingsUserQuery"] | undefined,
	public?: ModelTypes["BookingsPublicQuery"] | undefined
};
	["BookingsUserQuery"]: {
		/** This endpoint returns books owned by the user and sorted by the date of creation. */
	getSelfBooks: ModelTypes["BookingsGetBooksRepsond"],
	/** This endpoint returns bookings for a specific service and sorted by the date of creation. */
	getBookingsForService: ModelTypes["BookingsGetBookingsForServiceRespond"],
	/** This endpoint returns services owned by the user and sorted by the date of creation. */
	getSelfServices: ModelTypes["BookingsGetSelfServicesRespond"]
};
	["BookingsMutation"]: {
		/** if used user mutation endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserMutation will throw error about malformed source */
	user?: ModelTypes["BookingsUserMutation"] | undefined
};
	["BookingsPublicQuery"]: {
		listServices: ModelTypes["BookingsListServicesRespond"],
	getService: ModelTypes["BookingsGetServiceRespond"]
};
	["BookingsUserMutation"]: {
		registerService?: ModelTypes["BookingsRegisterServiceRespond"] | undefined,
	updateService: ModelTypes["BookingsUpdateServiceRespond"],
	removeService: ModelTypes["BookingsRemoveServiceRespond"],
	bookService: ModelTypes["BookingsBookServiceRespond"],
	respondOnServiceRequest: ModelTypes["BookingsRespondOnServiceRequestRespond"]
};
	["BookingsGetBookingsForServiceInput"]: {
	page?: ModelTypes["BookingsPageOptionsInput"] | undefined,
	filters?: ModelTypes["BookingsGetBookingsForServiceFiltersInput"] | undefined
};
	["BookingsGetBookingsForServiceFiltersInput"]: {
	fromDate?: ModelTypes["BookingsDate"] | undefined,
	toDate?: ModelTypes["BookingsDate"] | undefined,
	bookerId?: string | undefined,
	status?: ModelTypes["BookingsBookStatus"] | undefined
};
	["BookingsGetBookingsForServiceRespond"]: {
		books?: Array<ModelTypes["BookingsBookingRecord"]> | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsRespondOnServiceRequestInput"]: {
	bookId: string,
	/** answer field cannot be PENDING, otherwise it will throw error */
	answer: ModelTypes["BookingsBookStatus"]
};
	["BookingsGetSelfServicesInput"]: {
	page?: ModelTypes["BookingsPageOptionsInput"] | undefined,
	filters?: ModelTypes["BookingsGetSelfServicesFiltersInput"] | undefined
};
	["BookingsGetSelfServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined,
	/** description is regex */
	description?: string | undefined,
	fromDate?: ModelTypes["BookingsDate"] | undefined,
	toDate?: ModelTypes["BookingsDate"] | undefined
};
	["BookingsGetSelfServicesRespond"]: {
		service?: Array<ModelTypes["BookingsService"]> | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsRespondOnServiceRequestRespond"]: {
		status: boolean,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsGetBooksInput"]: {
	page?: ModelTypes["BookingsPageOptionsInput"] | undefined,
	filters?: ModelTypes["BookingsGetBooksFiltersInput"] | undefined
};
	["BookingsGetBooksFiltersInput"]: {
	startDate: string
};
	["BookingsListServicesInput"]: {
	page?: ModelTypes["BookingsPageOptionsInput"] | undefined,
	filters?: ModelTypes["BookingsListServicesFiltersInput"] | undefined
};
	["BookingsGetBooksRepsond"]: {
		books?: Array<ModelTypes["BookingsBookingRecord"]> | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsListServicesRespond"]: {
		services?: Array<ModelTypes["BookingsService"]> | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsGetServiceRespond"]: {
		service?: ModelTypes["BookingsService"] | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsRegisterUserInput"]: {
	username: string,
	email: string,
	phone?: string | undefined
};
	["BookingsRegisterServiceInput"]: {
	name: string,
	description: string,
	startDate: ModelTypes["BookingsDate"],
	time: number,
	neededAccept?: boolean | undefined,
	active?: boolean | undefined
};
	["BookingsRegisterServiceRespond"]: {
		service?: ModelTypes["BookingsService"] | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsUpdateServiceInput"]: {
	name?: string | undefined,
	description?: string | undefined,
	startDate?: ModelTypes["BookingsDate"] | undefined,
	time: number,
	active?: boolean | undefined,
	neededAccept?: boolean | undefined
};
	["BookingsUpdateServiceRespond"]: {
		service?: ModelTypes["BookingsService"] | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsRemoveServiceRespond"]: {
		removed?: boolean | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsBookServiceInput"]: {
	serviceId: string,
	comments?: string | undefined
};
	["BookingsBookServiceRespond"]: {
		book?: ModelTypes["BookingsBookingRecord"] | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsUserServiceRespond"]: {
		service?: Array<ModelTypes["BookingsService"] | undefined> | undefined,
	error?: ModelTypes["BookingsGlobalError"] | undefined
};
	["BookingsService"]: {
		name: string,
	description: string,
	ownerId: string,
	/** this field capture time, system does not recognize units, so be consent with your behavior */
	time?: number | undefined,
	startDate: ModelTypes["BookingsDate"],
	_id: string,
	createdAt: ModelTypes["BookingsDate"],
	updatedAt?: ModelTypes["BookingsDate"] | undefined,
	active?: boolean | undefined,
	taken?: boolean | undefined,
	neededAccept?: boolean | undefined
};
	["BookingsBookingRecord"]: {
		bookerId: string,
	service: ModelTypes["BookingsService"],
	comments?: string | undefined,
	_id: string,
	createdAt: ModelTypes["BookingsDate"],
	status: ModelTypes["BookingsBookStatus"],
	answeredAt?: ModelTypes["BookingsDate"] | undefined
};
	["BookingsGlobalError"]: {
		/** custom message of error */
	message?: string | undefined,
	/** path is name of resolver on which we got error */
	path?: string | undefined
};
	["BookingsdbEssentials"]: ModelTypes["BookingsService"] | ModelTypes["BookingsBookingRecord"];
	["BookingsPageOptionsInput"]: {
	/** default limit is 10 */
	limit?: number | undefined,
	/** count stating from 0 */
	page?: number | undefined
};
	["BookingsListServicesFiltersInput"]: {
	/** name is regex */
	name?: string | undefined,
	/** description is regex */
	description?: string | undefined,
	fromDate?: ModelTypes["BookingsDate"] | undefined,
	toDate?: ModelTypes["BookingsDate"] | undefined,
	ownerId?: string | undefined
};
	["BookingsDate"]:any;
	["BookingsBookStatus"]:BookingsBookStatus;
	["BookingsServiceType"]:BookingsServiceType
    }

export type GraphQLTypes = {
    ["UserQuery"]: {
	__typename: "UserQuery",
	randomQuery: string,
	bookingUserQuery: GraphQLTypes["BookingsUserQuery"]
};
	["UserMutation"]: {
	__typename: "UserMutation",
	randomMutation: string
};
	["Mutation"]: {
	__typename: "Mutation",
	user: GraphQLTypes["UserMutation"]
};
	["PublicQuery"]: {
	__typename: "PublicQuery",
	bookingPublicQuery: GraphQLTypes["BookingsPublicQuery"]
};
	["Query"]: {
	__typename: "Query",
	user: GraphQLTypes["UserQuery"],
	public: GraphQLTypes["PublicQuery"]
};
	["BookingsQuery"]: {
	__typename: "BookingsQuery",
	/** if used user query endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserQuery will throw error about malformed source */
	user?: GraphQLTypes["BookingsUserQuery"] | undefined,
	public?: GraphQLTypes["BookingsPublicQuery"] | undefined
};
	["BookingsUserQuery"]: {
	__typename: "BookingsUserQuery",
	/** This endpoint returns books owned by the user and sorted by the date of creation. */
	getSelfBooks: GraphQLTypes["BookingsGetBooksRepsond"],
	/** This endpoint returns bookings for a specific service and sorted by the date of creation. */
	getBookingsForService: GraphQLTypes["BookingsGetBookingsForServiceRespond"],
	/** This endpoint returns services owned by the user and sorted by the date of creation. */
	getSelfServices: GraphQLTypes["BookingsGetSelfServicesRespond"]
};
	["BookingsMutation"]: {
	__typename: "BookingsMutation",
	/** if used user mutation endpoint, it should contain in source:
userId: String!
which will be unique identifier for every user in system
in otherwise any endpoint in UserMutation will throw error about malformed source */
	user?: GraphQLTypes["BookingsUserMutation"] | undefined
};
	["BookingsPublicQuery"]: {
	__typename: "BookingsPublicQuery",
	listServices: GraphQLTypes["BookingsListServicesRespond"],
	getService: GraphQLTypes["BookingsGetServiceRespond"]
};
	["BookingsUserMutation"]: {
	__typename: "BookingsUserMutation",
	registerService?: GraphQLTypes["BookingsRegisterServiceRespond"] | undefined,
	updateService: GraphQLTypes["BookingsUpdateServiceRespond"],
	removeService: GraphQLTypes["BookingsRemoveServiceRespond"],
	bookService: GraphQLTypes["BookingsBookServiceRespond"],
	respondOnServiceRequest: GraphQLTypes["BookingsRespondOnServiceRequestRespond"]
};
	["BookingsGetBookingsForServiceInput"]: {
		page?: GraphQLTypes["BookingsPageOptionsInput"] | undefined,
	filters?: GraphQLTypes["BookingsGetBookingsForServiceFiltersInput"] | undefined
};
	["BookingsGetBookingsForServiceFiltersInput"]: {
		fromDate?: GraphQLTypes["BookingsDate"] | undefined,
	toDate?: GraphQLTypes["BookingsDate"] | undefined,
	bookerId?: string | undefined,
	status?: GraphQLTypes["BookingsBookStatus"] | undefined
};
	["BookingsGetBookingsForServiceRespond"]: {
	__typename: "BookingsGetBookingsForServiceRespond",
	books?: Array<GraphQLTypes["BookingsBookingRecord"]> | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsRespondOnServiceRequestInput"]: {
		bookId: string,
	/** answer field cannot be PENDING, otherwise it will throw error */
	answer: GraphQLTypes["BookingsBookStatus"]
};
	["BookingsGetSelfServicesInput"]: {
		page?: GraphQLTypes["BookingsPageOptionsInput"] | undefined,
	filters?: GraphQLTypes["BookingsGetSelfServicesFiltersInput"] | undefined
};
	["BookingsGetSelfServicesFiltersInput"]: {
		/** name is regex */
	name?: string | undefined,
	/** description is regex */
	description?: string | undefined,
	fromDate?: GraphQLTypes["BookingsDate"] | undefined,
	toDate?: GraphQLTypes["BookingsDate"] | undefined
};
	["BookingsGetSelfServicesRespond"]: {
	__typename: "BookingsGetSelfServicesRespond",
	service?: Array<GraphQLTypes["BookingsService"]> | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsRespondOnServiceRequestRespond"]: {
	__typename: "BookingsRespondOnServiceRequestRespond",
	status: boolean,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsGetBooksInput"]: {
		page?: GraphQLTypes["BookingsPageOptionsInput"] | undefined,
	filters?: GraphQLTypes["BookingsGetBooksFiltersInput"] | undefined
};
	["BookingsGetBooksFiltersInput"]: {
		startDate: string
};
	["BookingsListServicesInput"]: {
		page?: GraphQLTypes["BookingsPageOptionsInput"] | undefined,
	filters?: GraphQLTypes["BookingsListServicesFiltersInput"] | undefined
};
	["BookingsGetBooksRepsond"]: {
	__typename: "BookingsGetBooksRepsond",
	books?: Array<GraphQLTypes["BookingsBookingRecord"]> | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsListServicesRespond"]: {
	__typename: "BookingsListServicesRespond",
	services?: Array<GraphQLTypes["BookingsService"]> | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsGetServiceRespond"]: {
	__typename: "BookingsGetServiceRespond",
	service?: GraphQLTypes["BookingsService"] | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsRegisterUserInput"]: {
		username: string,
	email: string,
	phone?: string | undefined
};
	["BookingsRegisterServiceInput"]: {
		name: string,
	description: string,
	startDate: GraphQLTypes["BookingsDate"],
	time: number,
	neededAccept?: boolean | undefined,
	active?: boolean | undefined
};
	["BookingsRegisterServiceRespond"]: {
	__typename: "BookingsRegisterServiceRespond",
	service?: GraphQLTypes["BookingsService"] | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsUpdateServiceInput"]: {
		name?: string | undefined,
	description?: string | undefined,
	startDate?: GraphQLTypes["BookingsDate"] | undefined,
	time: number,
	active?: boolean | undefined,
	neededAccept?: boolean | undefined
};
	["BookingsUpdateServiceRespond"]: {
	__typename: "BookingsUpdateServiceRespond",
	service?: GraphQLTypes["BookingsService"] | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsRemoveServiceRespond"]: {
	__typename: "BookingsRemoveServiceRespond",
	removed?: boolean | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsBookServiceInput"]: {
		serviceId: string,
	comments?: string | undefined
};
	["BookingsBookServiceRespond"]: {
	__typename: "BookingsBookServiceRespond",
	book?: GraphQLTypes["BookingsBookingRecord"] | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsUserServiceRespond"]: {
	__typename: "BookingsUserServiceRespond",
	service?: Array<GraphQLTypes["BookingsService"] | undefined> | undefined,
	error?: GraphQLTypes["BookingsGlobalError"] | undefined
};
	["BookingsService"]: {
	__typename: "BookingsService",
	name: string,
	description: string,
	ownerId: string,
	/** this field capture time, system does not recognize units, so be consent with your behavior */
	time?: number | undefined,
	startDate: GraphQLTypes["BookingsDate"],
	_id: string,
	createdAt: GraphQLTypes["BookingsDate"],
	updatedAt?: GraphQLTypes["BookingsDate"] | undefined,
	active?: boolean | undefined,
	taken?: boolean | undefined,
	neededAccept?: boolean | undefined
};
	["BookingsBookingRecord"]: {
	__typename: "BookingsBookingRecord",
	bookerId: string,
	service: GraphQLTypes["BookingsService"],
	comments?: string | undefined,
	_id: string,
	createdAt: GraphQLTypes["BookingsDate"],
	status: GraphQLTypes["BookingsBookStatus"],
	answeredAt?: GraphQLTypes["BookingsDate"] | undefined
};
	["BookingsGlobalError"]: {
	__typename: "BookingsGlobalError",
	/** custom message of error */
	message?: string | undefined,
	/** path is name of resolver on which we got error */
	path?: string | undefined
};
	["BookingsdbEssentials"]: {
	__typename:"BookingsService" | "BookingsBookingRecord",
	_id: string,
	createdAt: GraphQLTypes["BookingsDate"]
	['...on BookingsService']: '__union' & GraphQLTypes["BookingsService"];
	['...on BookingsBookingRecord']: '__union' & GraphQLTypes["BookingsBookingRecord"];
};
	["BookingsPageOptionsInput"]: {
		/** default limit is 10 */
	limit?: number | undefined,
	/** count stating from 0 */
	page?: number | undefined
};
	["BookingsListServicesFiltersInput"]: {
		/** name is regex */
	name?: string | undefined,
	/** description is regex */
	description?: string | undefined,
	fromDate?: GraphQLTypes["BookingsDate"] | undefined,
	toDate?: GraphQLTypes["BookingsDate"] | undefined,
	ownerId?: string | undefined
};
	["BookingsDate"]: "scalar" & { name: "BookingsDate" };
	["BookingsBookStatus"]: BookingsBookStatus;
	["BookingsServiceType"]: BookingsServiceType
    }
export const enum BookingsBookStatus {
	PENDING = "PENDING",
	ACCEPTED = "ACCEPTED",
	DECLINED = "DECLINED"
}
export const enum BookingsServiceType {
	TIME = "TIME",
	EXPIRATION = "EXPIRATION"
}

type ZEUS_VARIABLES = {
	["BookingsGetBookingsForServiceInput"]: ValueTypes["BookingsGetBookingsForServiceInput"];
	["BookingsGetBookingsForServiceFiltersInput"]: ValueTypes["BookingsGetBookingsForServiceFiltersInput"];
	["BookingsRespondOnServiceRequestInput"]: ValueTypes["BookingsRespondOnServiceRequestInput"];
	["BookingsGetSelfServicesInput"]: ValueTypes["BookingsGetSelfServicesInput"];
	["BookingsGetSelfServicesFiltersInput"]: ValueTypes["BookingsGetSelfServicesFiltersInput"];
	["BookingsGetBooksInput"]: ValueTypes["BookingsGetBooksInput"];
	["BookingsGetBooksFiltersInput"]: ValueTypes["BookingsGetBooksFiltersInput"];
	["BookingsListServicesInput"]: ValueTypes["BookingsListServicesInput"];
	["BookingsRegisterUserInput"]: ValueTypes["BookingsRegisterUserInput"];
	["BookingsRegisterServiceInput"]: ValueTypes["BookingsRegisterServiceInput"];
	["BookingsUpdateServiceInput"]: ValueTypes["BookingsUpdateServiceInput"];
	["BookingsBookServiceInput"]: ValueTypes["BookingsBookServiceInput"];
	["BookingsPageOptionsInput"]: ValueTypes["BookingsPageOptionsInput"];
	["BookingsListServicesFiltersInput"]: ValueTypes["BookingsListServicesFiltersInput"];
	["BookingsDate"]: ValueTypes["BookingsDate"];
	["BookingsBookStatus"]: ValueTypes["BookingsBookStatus"];
	["BookingsServiceType"]: ValueTypes["BookingsServiceType"];
}