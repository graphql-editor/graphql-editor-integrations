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
	StripeTimestamp?: ScalarResolver;
	StripeAnyObject?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["StripeQuery"]: AliasType<{
products?: [{	filter?: ValueTypes["StripeProductFilter"] | undefined | null | Variable<any, string>},ValueTypes["StripeProductsPage"]],
subscriptions?: [{	filter?: ValueTypes["StripeSubscriptionFilter"] | undefined | null | Variable<any, string>},ValueTypes["StripeSubscription"]],
		__typename?: boolean | `@${string}`
}>;
	["StripeMutation"]: AliasType<{
initStripeCustomer?: [{	initStripeCustomerInput: ValueTypes["StripeInitStripeCustomerInput"] | Variable<any, string>},boolean | `@${string}`],
createCheckoutSession?: [{	payload: ValueTypes["StripeCreateCheckoutSessionInput"] | Variable<any, string>},boolean | `@${string}`],
createNewUserCheckoutSession?: [{	payload: ValueTypes["StripeCreateNewUserCheckoutSessionInput"] | Variable<any, string>},boolean | `@${string}`],
createCustomerPortal?: [{	payload: ValueTypes["StripeCreateCustomerPortalInput"] | Variable<any, string>},boolean | `@${string}`],
createConnectAccount?: [{	payload: ValueTypes["StripeCreateConnectAccountInput"] | Variable<any, string>},boolean | `@${string}`],
attachPaymentMethod?: [{	payload: ValueTypes["StripeAttachPaymentMethodInput"] | Variable<any, string>},boolean | `@${string}`],
setDefaultPaymentMethod?: [{	payload: ValueTypes["StripesetDefaultPaymentMethodInput"] | Variable<any, string>},boolean | `@${string}`],
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripesetDefaultPaymentMethodInput"]: {
	attachedPaymentMethodId: string | Variable<any, string>,
	customerId: string | Variable<any, string>
};
	["StripeAttachPaymentMethodInput"]: {
	paymentMethodId: string | Variable<any, string>,
	customerId: string | Variable<any, string>
};
	["StripeCreateConnectAccountInput"]: {
	type: ValueTypes["StripeConnectAccountType"] | Variable<any, string>,
	country: string | Variable<any, string>,
	email: string | Variable<any, string>,
	business_type: ValueTypes["StripeConnectAccountBusinessType"] | Variable<any, string>,
	bankAccount: ValueTypes["StripeBankAccountInput"] | Variable<any, string>
};
	["StripeConnectAccountBusinessType"]:StripeConnectAccountBusinessType;
	["StripeConnectAccountType"]:StripeConnectAccountType;
	["StripeBankAccountInput"]: {
	country: string | Variable<any, string>,
	/** Required supported currency for the country https://stripe.com/docs/payouts */
	currency: string | Variable<any, string>,
	/** IBAN account number */
	account_number: string | Variable<any, string>,
	/** Required when attaching the bank account to a Customer */
	account_holder_name: string | Variable<any, string>,
	account_holder_type: ValueTypes["StripeBankAccountHolderType"] | Variable<any, string>
};
	["StripeBankAccountHolderType"]:StripeBankAccountHolderType;
	["StripeSubscriptionFilter"]: {
	customerId?: string | undefined | null | Variable<any, string>
};
	["StripeSubscription"]: AliasType<{
	id?:boolean | `@${string}`,
	cancel_at_period_end?:boolean | `@${string}`,
	current_period_end?:boolean | `@${string}`,
	current_period_start?:boolean | `@${string}`,
	customer?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	items?:ValueTypes["StripeSubscriptionItems"],
	quantity?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeSubStatus"]:StripeSubStatus;
	["StripeSubscriptionItems"]: AliasType<{
	data?:ValueTypes["StripeItem"],
	has_more?:boolean | `@${string}`,
	total_count?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	object?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeItem"]: AliasType<{
	id?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	price?:ValueTypes["StripePrice"],
	quantity?:boolean | `@${string}`,
	subscription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeUser"]: AliasType<{
	stripeId?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeInitStripeCustomerInput"]: {
	email: string | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	phone?: string | undefined | null | Variable<any, string>,
	address?: ValueTypes["StripeAddressInput"] | undefined | null | Variable<any, string>
};
	["StripeCreateNewUserCheckoutSessionInput"]: {
	/** Return url after successful transaction */
	successUrl: string | Variable<any, string>,
	cancelUrl: string | Variable<any, string>,
	products: Array<ValueTypes["StripeProductInput"]> | Variable<any, string>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ValueTypes["StripeApplicationFeeInput"] | undefined | null | Variable<any, string>
};
	["StripeCreateCheckoutSessionInput"]: {
	username: string | Variable<any, string>,
	/** Return url after successful transaction */
	successUrl: string | Variable<any, string>,
	cancelUrl: string | Variable<any, string>,
	products: Array<ValueTypes["StripeProductInput"]> | Variable<any, string>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ValueTypes["StripeApplicationFeeInput"] | undefined | null | Variable<any, string>
};
	["StripeApplicationFeeInput"]: {
	/** Value from 0-100 */
	feePercentage: number | Variable<any, string>,
	/** Connect Account (not stripe customer) id */
	connectAccountId: string | Variable<any, string>
};
	["StripeProductInput"]: {
	productId: string | Variable<any, string>,
	quantity: number | Variable<any, string>
};
	["StripeCreateCustomerPortalInput"]: {
	username: string | Variable<any, string>,
	returnUrl: string | Variable<any, string>
};
	["StripeAddressInput"]: {
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
	address?:ValueTypes["StripeAddress"],
		__typename?: boolean | `@${string}`
}>;
	["StripeAddress"]: AliasType<{
	city?:boolean | `@${string}`,
	country?:boolean | `@${string}`,
	line1?:boolean | `@${string}`,
	line2?:boolean | `@${string}`,
	postal_code?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeProductFilter"]: {
	active?: boolean | undefined | null | Variable<any, string>,
	created?: ValueTypes["StripeTimestampFilter"] | undefined | null | Variable<any, string>,
	limit?: number | undefined | null | Variable<any, string>,
	shippable?: boolean | undefined | null | Variable<any, string>,
	ids?: Array<string> | undefined | null | Variable<any, string>,
	starting_after?: string | undefined | null | Variable<any, string>,
	ending_before?: string | undefined | null | Variable<any, string>,
	url?: string | undefined | null | Variable<any, string>
};
	["StripeRecurringFilter"]: {
	interval?: ValueTypes["StripeInterval"] | undefined | null | Variable<any, string>,
	usageType?: ValueTypes["StripeUsageType"] | undefined | null | Variable<any, string>
};
	["StripePriceFilter"]: {
	active?: boolean | undefined | null | Variable<any, string>,
	currency?: string | undefined | null | Variable<any, string>,
	product?: string | undefined | null | Variable<any, string>,
	type?: ValueTypes["StripeType"] | undefined | null | Variable<any, string>,
	created?: ValueTypes["StripeTimestampFilter"] | undefined | null | Variable<any, string>,
	limit?: number | undefined | null | Variable<any, string>,
	starting_after?: string | undefined | null | Variable<any, string>,
	ending_before?: string | undefined | null | Variable<any, string>,
	recurring?: ValueTypes["StripeRecurringFilter"] | undefined | null | Variable<any, string>
};
	["StripeDimensions"]: AliasType<{
	height?:boolean | `@${string}`,
	length?:boolean | `@${string}`,
	weight?:boolean | `@${string}`,
	width?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeProduct"]: AliasType<{
	id?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	default_price?:ValueTypes["StripePrice"],
	description?:boolean | `@${string}`,
	images?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	package_dimensions?:ValueTypes["StripeDimensions"],
	shippable?:boolean | `@${string}`,
	statement_descriptor?:boolean | `@${string}`,
	tax_code?:boolean | `@${string}`,
	unitLabel?:boolean | `@${string}`,
	updated?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	prices?:ValueTypes["StripePrice"],
		__typename?: boolean | `@${string}`
}>;
	["StripeBillingScheme"]:StripeBillingScheme;
	/** Offset measured in seconds since Unix epoch. */
["StripeTimestamp"]:unknown;
	["StripeTimestampFilter"]: {
	Gt?: ValueTypes["StripeTimestamp"] | undefined | null | Variable<any, string>,
	Gte?: ValueTypes["StripeTimestamp"] | undefined | null | Variable<any, string>,
	Lt?: ValueTypes["StripeTimestamp"] | undefined | null | Variable<any, string>,
	Lte?: ValueTypes["StripeTimestamp"] | undefined | null | Variable<any, string>
};
	["StripeCustomUnitAmount"]: AliasType<{
	maximum?:boolean | `@${string}`,
	minimum?:boolean | `@${string}`,
	preset?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Any value that can be represented as JSON object */
["StripeAnyObject"]:unknown;
	["StripeAggregateUsage"]:StripeAggregateUsage;
	["StripeInterval"]:StripeInterval;
	["StripeUsageType"]:StripeUsageType;
	["StripePriceRecurring"]: AliasType<{
	aggregate_usage?:boolean | `@${string}`,
	interval?:boolean | `@${string}`,
	interval_count?:boolean | `@${string}`,
	usage_type?:boolean | `@${string}`,
	trial_period_days?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeTaxBehaviour"]:StripeTaxBehaviour;
	["StripeTiersMode"]:StripeTiersMode;
	["StripeRound"]:StripeRound;
	["StripeTransformQuantity"]: AliasType<{
	divideBy?:boolean | `@${string}`,
	round?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeType"]:StripeType;
	["StripePrice"]: AliasType<{
	id?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	billing_scheme?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	currency?:boolean | `@${string}`,
	custom_unit_amount?:ValueTypes["StripeCustomUnitAmount"],
	livemode?:boolean | `@${string}`,
	lookup_key?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	nickname?:boolean | `@${string}`,
	product?:ValueTypes["StripeProduct"],
	recurring?:ValueTypes["StripePriceRecurring"],
	tax_behavior?:boolean | `@${string}`,
	tiers_mode?:boolean | `@${string}`,
	transform_quantity?:ValueTypes["StripeTransformQuantity"],
	type?:boolean | `@${string}`,
	unit_amount?:boolean | `@${string}`,
	unit_amount_decimal?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeProductsPage"]: AliasType<{
	products?:ValueTypes["StripeProduct"],
	startingAfter?:boolean | `@${string}`,
	endingBefore?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	webhook?:boolean | `@${string}`,
	StripeMutation?:ValueTypes["StripeMutation"],
		__typename?: boolean | `@${string}`
}>;
	["Query"]: AliasType<{
	StripeQuery?:ValueTypes["StripeQuery"],
		__typename?: boolean | `@${string}`
}>
  }

export type ResolverInputTypes = {
    ["StripeQuery"]: AliasType<{
products?: [{	filter?: ResolverInputTypes["StripeProductFilter"] | undefined | null},ResolverInputTypes["StripeProductsPage"]],
subscriptions?: [{	filter?: ResolverInputTypes["StripeSubscriptionFilter"] | undefined | null},ResolverInputTypes["StripeSubscription"]],
		__typename?: boolean | `@${string}`
}>;
	["StripeMutation"]: AliasType<{
initStripeCustomer?: [{	initStripeCustomerInput: ResolverInputTypes["StripeInitStripeCustomerInput"]},boolean | `@${string}`],
createCheckoutSession?: [{	payload: ResolverInputTypes["StripeCreateCheckoutSessionInput"]},boolean | `@${string}`],
createNewUserCheckoutSession?: [{	payload: ResolverInputTypes["StripeCreateNewUserCheckoutSessionInput"]},boolean | `@${string}`],
createCustomerPortal?: [{	payload: ResolverInputTypes["StripeCreateCustomerPortalInput"]},boolean | `@${string}`],
createConnectAccount?: [{	payload: ResolverInputTypes["StripeCreateConnectAccountInput"]},boolean | `@${string}`],
attachPaymentMethod?: [{	payload: ResolverInputTypes["StripeAttachPaymentMethodInput"]},boolean | `@${string}`],
setDefaultPaymentMethod?: [{	payload: ResolverInputTypes["StripesetDefaultPaymentMethodInput"]},boolean | `@${string}`],
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripesetDefaultPaymentMethodInput"]: {
	attachedPaymentMethodId: string,
	customerId: string
};
	["StripeAttachPaymentMethodInput"]: {
	paymentMethodId: string,
	customerId: string
};
	["StripeCreateConnectAccountInput"]: {
	type: ResolverInputTypes["StripeConnectAccountType"],
	country: string,
	email: string,
	business_type: ResolverInputTypes["StripeConnectAccountBusinessType"],
	bankAccount: ResolverInputTypes["StripeBankAccountInput"]
};
	["StripeConnectAccountBusinessType"]:StripeConnectAccountBusinessType;
	["StripeConnectAccountType"]:StripeConnectAccountType;
	["StripeBankAccountInput"]: {
	country: string,
	/** Required supported currency for the country https://stripe.com/docs/payouts */
	currency: string,
	/** IBAN account number */
	account_number: string,
	/** Required when attaching the bank account to a Customer */
	account_holder_name: string,
	account_holder_type: ResolverInputTypes["StripeBankAccountHolderType"]
};
	["StripeBankAccountHolderType"]:StripeBankAccountHolderType;
	["StripeSubscriptionFilter"]: {
	customerId?: string | undefined | null
};
	["StripeSubscription"]: AliasType<{
	id?:boolean | `@${string}`,
	cancel_at_period_end?:boolean | `@${string}`,
	current_period_end?:boolean | `@${string}`,
	current_period_start?:boolean | `@${string}`,
	customer?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	items?:ResolverInputTypes["StripeSubscriptionItems"],
	quantity?:boolean | `@${string}`,
	status?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeSubStatus"]:StripeSubStatus;
	["StripeSubscriptionItems"]: AliasType<{
	data?:ResolverInputTypes["StripeItem"],
	has_more?:boolean | `@${string}`,
	total_count?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	object?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeItem"]: AliasType<{
	id?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	price?:ResolverInputTypes["StripePrice"],
	quantity?:boolean | `@${string}`,
	subscription?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeUser"]: AliasType<{
	stripeId?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeInitStripeCustomerInput"]: {
	email: string,
	name?: string | undefined | null,
	phone?: string | undefined | null,
	address?: ResolverInputTypes["StripeAddressInput"] | undefined | null
};
	["StripeCreateNewUserCheckoutSessionInput"]: {
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<ResolverInputTypes["StripeProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ResolverInputTypes["StripeApplicationFeeInput"] | undefined | null
};
	["StripeCreateCheckoutSessionInput"]: {
	username: string,
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<ResolverInputTypes["StripeProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ResolverInputTypes["StripeApplicationFeeInput"] | undefined | null
};
	["StripeApplicationFeeInput"]: {
	/** Value from 0-100 */
	feePercentage: number,
	/** Connect Account (not stripe customer) id */
	connectAccountId: string
};
	["StripeProductInput"]: {
	productId: string,
	quantity: number
};
	["StripeCreateCustomerPortalInput"]: {
	username: string,
	returnUrl: string
};
	["StripeAddressInput"]: {
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
	address?:ResolverInputTypes["StripeAddress"],
		__typename?: boolean | `@${string}`
}>;
	["StripeAddress"]: AliasType<{
	city?:boolean | `@${string}`,
	country?:boolean | `@${string}`,
	line1?:boolean | `@${string}`,
	line2?:boolean | `@${string}`,
	postal_code?:boolean | `@${string}`,
	state?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeProductFilter"]: {
	active?: boolean | undefined | null,
	created?: ResolverInputTypes["StripeTimestampFilter"] | undefined | null,
	limit?: number | undefined | null,
	shippable?: boolean | undefined | null,
	ids?: Array<string> | undefined | null,
	starting_after?: string | undefined | null,
	ending_before?: string | undefined | null,
	url?: string | undefined | null
};
	["StripeRecurringFilter"]: {
	interval?: ResolverInputTypes["StripeInterval"] | undefined | null,
	usageType?: ResolverInputTypes["StripeUsageType"] | undefined | null
};
	["StripePriceFilter"]: {
	active?: boolean | undefined | null,
	currency?: string | undefined | null,
	product?: string | undefined | null,
	type?: ResolverInputTypes["StripeType"] | undefined | null,
	created?: ResolverInputTypes["StripeTimestampFilter"] | undefined | null,
	limit?: number | undefined | null,
	starting_after?: string | undefined | null,
	ending_before?: string | undefined | null,
	recurring?: ResolverInputTypes["StripeRecurringFilter"] | undefined | null
};
	["StripeDimensions"]: AliasType<{
	height?:boolean | `@${string}`,
	length?:boolean | `@${string}`,
	weight?:boolean | `@${string}`,
	width?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeProduct"]: AliasType<{
	id?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	default_price?:ResolverInputTypes["StripePrice"],
	description?:boolean | `@${string}`,
	images?:boolean | `@${string}`,
	livemode?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	package_dimensions?:ResolverInputTypes["StripeDimensions"],
	shippable?:boolean | `@${string}`,
	statement_descriptor?:boolean | `@${string}`,
	tax_code?:boolean | `@${string}`,
	unitLabel?:boolean | `@${string}`,
	updated?:boolean | `@${string}`,
	url?:boolean | `@${string}`,
	prices?:ResolverInputTypes["StripePrice"],
		__typename?: boolean | `@${string}`
}>;
	["StripeBillingScheme"]:StripeBillingScheme;
	/** Offset measured in seconds since Unix epoch. */
["StripeTimestamp"]:unknown;
	["StripeTimestampFilter"]: {
	Gt?: ResolverInputTypes["StripeTimestamp"] | undefined | null,
	Gte?: ResolverInputTypes["StripeTimestamp"] | undefined | null,
	Lt?: ResolverInputTypes["StripeTimestamp"] | undefined | null,
	Lte?: ResolverInputTypes["StripeTimestamp"] | undefined | null
};
	["StripeCustomUnitAmount"]: AliasType<{
	maximum?:boolean | `@${string}`,
	minimum?:boolean | `@${string}`,
	preset?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Any value that can be represented as JSON object */
["StripeAnyObject"]:unknown;
	["StripeAggregateUsage"]:StripeAggregateUsage;
	["StripeInterval"]:StripeInterval;
	["StripeUsageType"]:StripeUsageType;
	["StripePriceRecurring"]: AliasType<{
	aggregate_usage?:boolean | `@${string}`,
	interval?:boolean | `@${string}`,
	interval_count?:boolean | `@${string}`,
	usage_type?:boolean | `@${string}`,
	trial_period_days?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeTaxBehaviour"]:StripeTaxBehaviour;
	["StripeTiersMode"]:StripeTiersMode;
	["StripeRound"]:StripeRound;
	["StripeTransformQuantity"]: AliasType<{
	divideBy?:boolean | `@${string}`,
	round?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeType"]:StripeType;
	["StripePrice"]: AliasType<{
	id?:boolean | `@${string}`,
	active?:boolean | `@${string}`,
	billing_scheme?:boolean | `@${string}`,
	created?:boolean | `@${string}`,
	currency?:boolean | `@${string}`,
	custom_unit_amount?:ResolverInputTypes["StripeCustomUnitAmount"],
	livemode?:boolean | `@${string}`,
	lookup_key?:boolean | `@${string}`,
	metadata?:boolean | `@${string}`,
	nickname?:boolean | `@${string}`,
	product?:ResolverInputTypes["StripeProduct"],
	recurring?:ResolverInputTypes["StripePriceRecurring"],
	tax_behavior?:boolean | `@${string}`,
	tiers_mode?:boolean | `@${string}`,
	transform_quantity?:ResolverInputTypes["StripeTransformQuantity"],
	type?:boolean | `@${string}`,
	unit_amount?:boolean | `@${string}`,
	unit_amount_decimal?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StripeProductsPage"]: AliasType<{
	products?:ResolverInputTypes["StripeProduct"],
	startingAfter?:boolean | `@${string}`,
	endingBefore?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	webhook?:boolean | `@${string}`,
	StripeMutation?:ResolverInputTypes["StripeMutation"],
		__typename?: boolean | `@${string}`
}>;
	["Query"]: AliasType<{
	StripeQuery?:ResolverInputTypes["StripeQuery"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["StripeQuery"]: {
		products?: ModelTypes["StripeProductsPage"] | undefined,
	subscriptions?: Array<ModelTypes["StripeSubscription"]> | undefined
};
	["StripeMutation"]: {
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
	/** entry point for Weebhooks. */
	webhook?: string | undefined
};
	["StripesetDefaultPaymentMethodInput"]: {
	attachedPaymentMethodId: string,
	customerId: string
};
	["StripeAttachPaymentMethodInput"]: {
	paymentMethodId: string,
	customerId: string
};
	["StripeCreateConnectAccountInput"]: {
	type: ModelTypes["StripeConnectAccountType"],
	country: string,
	email: string,
	business_type: ModelTypes["StripeConnectAccountBusinessType"],
	bankAccount: ModelTypes["StripeBankAccountInput"]
};
	["StripeConnectAccountBusinessType"]:StripeConnectAccountBusinessType;
	["StripeConnectAccountType"]:StripeConnectAccountType;
	["StripeBankAccountInput"]: {
	country: string,
	/** Required supported currency for the country https://stripe.com/docs/payouts */
	currency: string,
	/** IBAN account number */
	account_number: string,
	/** Required when attaching the bank account to a Customer */
	account_holder_name: string,
	account_holder_type: ModelTypes["StripeBankAccountHolderType"]
};
	["StripeBankAccountHolderType"]:StripeBankAccountHolderType;
	["StripeSubscriptionFilter"]: {
	customerId?: string | undefined
};
	["StripeSubscription"]: {
		id: string,
	cancel_at_period_end: boolean,
	current_period_end: ModelTypes["StripeTimestamp"],
	current_period_start: ModelTypes["StripeTimestamp"],
	customer: string,
	description?: string | undefined,
	items: ModelTypes["StripeSubscriptionItems"],
	quantity: number,
	status: ModelTypes["StripeSubStatus"]
};
	["StripeSubStatus"]:StripeSubStatus;
	["StripeSubscriptionItems"]: {
		data: Array<ModelTypes["StripeItem"]>,
	has_more: boolean,
	total_count: number,
	url: string,
	object: string
};
	["StripeItem"]: {
		id: string,
	created: ModelTypes["StripeTimestamp"],
	metadata?: ModelTypes["StripeAnyObject"] | undefined,
	price: ModelTypes["StripePrice"],
	quantity: number,
	subscription: string
};
	["StripeUser"]: {
		stripeId?: string | undefined,
	email: string
};
	["StripeInitStripeCustomerInput"]: {
	email: string,
	name?: string | undefined,
	phone?: string | undefined,
	address?: ModelTypes["StripeAddressInput"] | undefined
};
	["StripeCreateNewUserCheckoutSessionInput"]: {
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<ModelTypes["StripeProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ModelTypes["StripeApplicationFeeInput"] | undefined
};
	["StripeCreateCheckoutSessionInput"]: {
	username: string,
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<ModelTypes["StripeProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: ModelTypes["StripeApplicationFeeInput"] | undefined
};
	["StripeApplicationFeeInput"]: {
	/** Value from 0-100 */
	feePercentage: number,
	/** Connect Account (not stripe customer) id */
	connectAccountId: string
};
	["StripeProductInput"]: {
	productId: string,
	quantity: number
};
	["StripeCreateCustomerPortalInput"]: {
	username: string,
	returnUrl: string
};
	["StripeAddressInput"]: {
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
	address?: ModelTypes["StripeAddress"] | undefined
};
	["StripeAddress"]: {
		city?: string | undefined,
	country?: string | undefined,
	line1?: string | undefined,
	line2?: string | undefined,
	postal_code?: string | undefined,
	state?: string | undefined
};
	["StripeProductFilter"]: {
	active?: boolean | undefined,
	created?: ModelTypes["StripeTimestampFilter"] | undefined,
	limit?: number | undefined,
	shippable?: boolean | undefined,
	ids?: Array<string> | undefined,
	starting_after?: string | undefined,
	ending_before?: string | undefined,
	url?: string | undefined
};
	["StripeRecurringFilter"]: {
	interval?: ModelTypes["StripeInterval"] | undefined,
	usageType?: ModelTypes["StripeUsageType"] | undefined
};
	["StripePriceFilter"]: {
	active?: boolean | undefined,
	currency?: string | undefined,
	product?: string | undefined,
	type?: ModelTypes["StripeType"] | undefined,
	created?: ModelTypes["StripeTimestampFilter"] | undefined,
	limit?: number | undefined,
	starting_after?: string | undefined,
	ending_before?: string | undefined,
	recurring?: ModelTypes["StripeRecurringFilter"] | undefined
};
	["StripeDimensions"]: {
		height?: number | undefined,
	length?: number | undefined,
	weight?: number | undefined,
	width?: number | undefined
};
	["StripeProduct"]: {
		id: string,
	active: boolean,
	created?: ModelTypes["StripeTimestamp"] | undefined,
	default_price?: ModelTypes["StripePrice"] | undefined,
	description?: string | undefined,
	images?: Array<string> | undefined,
	livemode?: boolean | undefined,
	metadata?: ModelTypes["StripeAnyObject"] | undefined,
	name?: string | undefined,
	package_dimensions?: ModelTypes["StripeDimensions"] | undefined,
	shippable?: boolean | undefined,
	statement_descriptor?: string | undefined,
	tax_code?: string | undefined,
	unitLabel?: string | undefined,
	updated?: ModelTypes["StripeTimestamp"] | undefined,
	url?: string | undefined,
	prices?: Array<ModelTypes["StripePrice"]> | undefined
};
	["StripeBillingScheme"]:StripeBillingScheme;
	/** Offset measured in seconds since Unix epoch. */
["StripeTimestamp"]:any;
	["StripeTimestampFilter"]: {
	Gt?: ModelTypes["StripeTimestamp"] | undefined,
	Gte?: ModelTypes["StripeTimestamp"] | undefined,
	Lt?: ModelTypes["StripeTimestamp"] | undefined,
	Lte?: ModelTypes["StripeTimestamp"] | undefined
};
	["StripeCustomUnitAmount"]: {
		maximum?: number | undefined,
	minimum?: number | undefined,
	preset?: number | undefined
};
	/** Any value that can be represented as JSON object */
["StripeAnyObject"]:any;
	["StripeAggregateUsage"]:StripeAggregateUsage;
	["StripeInterval"]:StripeInterval;
	["StripeUsageType"]:StripeUsageType;
	["StripePriceRecurring"]: {
		aggregate_usage?: ModelTypes["StripeAggregateUsage"] | undefined,
	interval?: ModelTypes["StripeInterval"] | undefined,
	interval_count?: number | undefined,
	usage_type?: ModelTypes["StripeUsageType"] | undefined,
	trial_period_days?: number | undefined
};
	["StripeTaxBehaviour"]:StripeTaxBehaviour;
	["StripeTiersMode"]:StripeTiersMode;
	["StripeRound"]:StripeRound;
	["StripeTransformQuantity"]: {
		divideBy?: number | undefined,
	round?: ModelTypes["StripeRound"] | undefined
};
	["StripeType"]:StripeType;
	["StripePrice"]: {
		id: string,
	active?: boolean | undefined,
	billing_scheme?: ModelTypes["StripeBillingScheme"] | undefined,
	created?: ModelTypes["StripeTimestamp"] | undefined,
	currency?: string | undefined,
	custom_unit_amount?: ModelTypes["StripeCustomUnitAmount"] | undefined,
	livemode?: boolean | undefined,
	lookup_key?: string | undefined,
	metadata?: ModelTypes["StripeAnyObject"] | undefined,
	nickname?: string | undefined,
	product?: ModelTypes["StripeProduct"] | undefined,
	recurring?: ModelTypes["StripePriceRecurring"] | undefined,
	tax_behavior?: ModelTypes["StripeTaxBehaviour"] | undefined,
	tiers_mode?: ModelTypes["StripeTiersMode"] | undefined,
	transform_quantity?: ModelTypes["StripeTransformQuantity"] | undefined,
	type?: ModelTypes["StripeType"] | undefined,
	unit_amount?: number | undefined,
	unit_amount_decimal?: string | undefined
};
	["StripeProductsPage"]: {
		products?: Array<ModelTypes["StripeProduct"]> | undefined,
	startingAfter?: string | undefined,
	endingBefore?: string | undefined
};
	["Mutation"]: {
		webhook?: string | undefined,
	StripeMutation: ModelTypes["StripeMutation"]
};
	["Query"]: {
		StripeQuery: ModelTypes["StripeQuery"]
}
    }

export type GraphQLTypes = {
    ["StripeQuery"]: {
	__typename: "StripeQuery",
	products?: GraphQLTypes["StripeProductsPage"] | undefined,
	subscriptions?: Array<GraphQLTypes["StripeSubscription"]> | undefined
};
	["StripeMutation"]: {
	__typename: "StripeMutation",
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
	/** entry point for Weebhooks. */
	webhook?: string | undefined
};
	["StripesetDefaultPaymentMethodInput"]: {
		attachedPaymentMethodId: string,
	customerId: string
};
	["StripeAttachPaymentMethodInput"]: {
		paymentMethodId: string,
	customerId: string
};
	["StripeCreateConnectAccountInput"]: {
		type: GraphQLTypes["StripeConnectAccountType"],
	country: string,
	email: string,
	business_type: GraphQLTypes["StripeConnectAccountBusinessType"],
	bankAccount: GraphQLTypes["StripeBankAccountInput"]
};
	["StripeConnectAccountBusinessType"]: StripeConnectAccountBusinessType;
	["StripeConnectAccountType"]: StripeConnectAccountType;
	["StripeBankAccountInput"]: {
		country: string,
	/** Required supported currency for the country https://stripe.com/docs/payouts */
	currency: string,
	/** IBAN account number */
	account_number: string,
	/** Required when attaching the bank account to a Customer */
	account_holder_name: string,
	account_holder_type: GraphQLTypes["StripeBankAccountHolderType"]
};
	["StripeBankAccountHolderType"]: StripeBankAccountHolderType;
	["StripeSubscriptionFilter"]: {
		customerId?: string | undefined
};
	["StripeSubscription"]: {
	__typename: "StripeSubscription",
	id: string,
	cancel_at_period_end: boolean,
	current_period_end: GraphQLTypes["StripeTimestamp"],
	current_period_start: GraphQLTypes["StripeTimestamp"],
	customer: string,
	description?: string | undefined,
	items: GraphQLTypes["StripeSubscriptionItems"],
	quantity: number,
	status: GraphQLTypes["StripeSubStatus"]
};
	["StripeSubStatus"]: StripeSubStatus;
	["StripeSubscriptionItems"]: {
	__typename: "StripeSubscriptionItems",
	data: Array<GraphQLTypes["StripeItem"]>,
	has_more: boolean,
	total_count: number,
	url: string,
	object: string
};
	["StripeItem"]: {
	__typename: "StripeItem",
	id: string,
	created: GraphQLTypes["StripeTimestamp"],
	metadata?: GraphQLTypes["StripeAnyObject"] | undefined,
	price: GraphQLTypes["StripePrice"],
	quantity: number,
	subscription: string
};
	["StripeUser"]: {
	__typename: "StripeUser",
	stripeId?: string | undefined,
	email: string
};
	["StripeInitStripeCustomerInput"]: {
		email: string,
	name?: string | undefined,
	phone?: string | undefined,
	address?: GraphQLTypes["StripeAddressInput"] | undefined
};
	["StripeCreateNewUserCheckoutSessionInput"]: {
		/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<GraphQLTypes["StripeProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: GraphQLTypes["StripeApplicationFeeInput"] | undefined
};
	["StripeCreateCheckoutSessionInput"]: {
		username: string,
	/** Return url after successful transaction */
	successUrl: string,
	cancelUrl: string,
	products: Array<GraphQLTypes["StripeProductInput"]>,
	/** Define amount to transfer into stripe connect account and set the rest for application fees */
	applicationFee?: GraphQLTypes["StripeApplicationFeeInput"] | undefined
};
	["StripeApplicationFeeInput"]: {
		/** Value from 0-100 */
	feePercentage: number,
	/** Connect Account (not stripe customer) id */
	connectAccountId: string
};
	["StripeProductInput"]: {
		productId: string,
	quantity: number
};
	["StripeCreateCustomerPortalInput"]: {
		username: string,
	returnUrl: string
};
	["StripeAddressInput"]: {
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
	address?: GraphQLTypes["StripeAddress"] | undefined
};
	["StripeAddress"]: {
	__typename: "StripeAddress",
	city?: string | undefined,
	country?: string | undefined,
	line1?: string | undefined,
	line2?: string | undefined,
	postal_code?: string | undefined,
	state?: string | undefined
};
	["StripeProductFilter"]: {
		active?: boolean | undefined,
	created?: GraphQLTypes["StripeTimestampFilter"] | undefined,
	limit?: number | undefined,
	shippable?: boolean | undefined,
	ids?: Array<string> | undefined,
	starting_after?: string | undefined,
	ending_before?: string | undefined,
	url?: string | undefined
};
	["StripeRecurringFilter"]: {
		interval?: GraphQLTypes["StripeInterval"] | undefined,
	usageType?: GraphQLTypes["StripeUsageType"] | undefined
};
	["StripePriceFilter"]: {
		active?: boolean | undefined,
	currency?: string | undefined,
	product?: string | undefined,
	type?: GraphQLTypes["StripeType"] | undefined,
	created?: GraphQLTypes["StripeTimestampFilter"] | undefined,
	limit?: number | undefined,
	starting_after?: string | undefined,
	ending_before?: string | undefined,
	recurring?: GraphQLTypes["StripeRecurringFilter"] | undefined
};
	["StripeDimensions"]: {
	__typename: "StripeDimensions",
	height?: number | undefined,
	length?: number | undefined,
	weight?: number | undefined,
	width?: number | undefined
};
	["StripeProduct"]: {
	__typename: "StripeProduct",
	id: string,
	active: boolean,
	created?: GraphQLTypes["StripeTimestamp"] | undefined,
	default_price?: GraphQLTypes["StripePrice"] | undefined,
	description?: string | undefined,
	images?: Array<string> | undefined,
	livemode?: boolean | undefined,
	metadata?: GraphQLTypes["StripeAnyObject"] | undefined,
	name?: string | undefined,
	package_dimensions?: GraphQLTypes["StripeDimensions"] | undefined,
	shippable?: boolean | undefined,
	statement_descriptor?: string | undefined,
	tax_code?: string | undefined,
	unitLabel?: string | undefined,
	updated?: GraphQLTypes["StripeTimestamp"] | undefined,
	url?: string | undefined,
	prices?: Array<GraphQLTypes["StripePrice"]> | undefined
};
	["StripeBillingScheme"]: StripeBillingScheme;
	/** Offset measured in seconds since Unix epoch. */
["StripeTimestamp"]: "scalar" & { name: "StripeTimestamp" };
	["StripeTimestampFilter"]: {
		Gt?: GraphQLTypes["StripeTimestamp"] | undefined,
	Gte?: GraphQLTypes["StripeTimestamp"] | undefined,
	Lt?: GraphQLTypes["StripeTimestamp"] | undefined,
	Lte?: GraphQLTypes["StripeTimestamp"] | undefined
};
	["StripeCustomUnitAmount"]: {
	__typename: "StripeCustomUnitAmount",
	maximum?: number | undefined,
	minimum?: number | undefined,
	preset?: number | undefined
};
	/** Any value that can be represented as JSON object */
["StripeAnyObject"]: "scalar" & { name: "StripeAnyObject" };
	["StripeAggregateUsage"]: StripeAggregateUsage;
	["StripeInterval"]: StripeInterval;
	["StripeUsageType"]: StripeUsageType;
	["StripePriceRecurring"]: {
	__typename: "StripePriceRecurring",
	aggregate_usage?: GraphQLTypes["StripeAggregateUsage"] | undefined,
	interval?: GraphQLTypes["StripeInterval"] | undefined,
	interval_count?: number | undefined,
	usage_type?: GraphQLTypes["StripeUsageType"] | undefined,
	trial_period_days?: number | undefined
};
	["StripeTaxBehaviour"]: StripeTaxBehaviour;
	["StripeTiersMode"]: StripeTiersMode;
	["StripeRound"]: StripeRound;
	["StripeTransformQuantity"]: {
	__typename: "StripeTransformQuantity",
	divideBy?: number | undefined,
	round?: GraphQLTypes["StripeRound"] | undefined
};
	["StripeType"]: StripeType;
	["StripePrice"]: {
	__typename: "StripePrice",
	id: string,
	active?: boolean | undefined,
	billing_scheme?: GraphQLTypes["StripeBillingScheme"] | undefined,
	created?: GraphQLTypes["StripeTimestamp"] | undefined,
	currency?: string | undefined,
	custom_unit_amount?: GraphQLTypes["StripeCustomUnitAmount"] | undefined,
	livemode?: boolean | undefined,
	lookup_key?: string | undefined,
	metadata?: GraphQLTypes["StripeAnyObject"] | undefined,
	nickname?: string | undefined,
	product?: GraphQLTypes["StripeProduct"] | undefined,
	recurring?: GraphQLTypes["StripePriceRecurring"] | undefined,
	tax_behavior?: GraphQLTypes["StripeTaxBehaviour"] | undefined,
	tiers_mode?: GraphQLTypes["StripeTiersMode"] | undefined,
	transform_quantity?: GraphQLTypes["StripeTransformQuantity"] | undefined,
	type?: GraphQLTypes["StripeType"] | undefined,
	unit_amount?: number | undefined,
	unit_amount_decimal?: string | undefined
};
	["StripeProductsPage"]: {
	__typename: "StripeProductsPage",
	products?: Array<GraphQLTypes["StripeProduct"]> | undefined,
	startingAfter?: string | undefined,
	endingBefore?: string | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	webhook?: string | undefined,
	StripeMutation: GraphQLTypes["StripeMutation"]
};
	["Query"]: {
	__typename: "Query",
	StripeQuery: GraphQLTypes["StripeQuery"]
}
    }
export const enum StripeConnectAccountBusinessType {
	company = "company",
	government_entity = "government_entity",
	individual = "individual",
	non_profit = "non_profit"
}
export const enum StripeConnectAccountType {
	standard = "standard",
	express = "express",
	custom = "custom"
}
export const enum StripeBankAccountHolderType {
	individual = "individual",
	company = "company"
}
export const enum StripeSubStatus {
	incomplete = "incomplete",
	incomplete_expired = "incomplete_expired",
	trialing = "trialing",
	active = "active",
	past_due = "past_due",
	canceled = "canceled",
	unpaid = "unpaid"
}
export const enum StripeBillingScheme {
	PER_UNIT = "PER_UNIT",
	TIERED = "TIERED"
}
export const enum StripeAggregateUsage {
	SUM = "SUM",
	LAST_DURING_PERIOD = "LAST_DURING_PERIOD",
	LAST_EVER = "LAST_EVER",
	MAX = "MAX"
}
export const enum StripeInterval {
	MONTH = "MONTH",
	YEAR = "YEAR",
	WEEK = "WEEK",
	DAY = "DAY"
}
export const enum StripeUsageType {
	METERED = "METERED",
	LICENSED = "LICENSED"
}
export const enum StripeTaxBehaviour {
	INCLUSIVE = "INCLUSIVE",
	EXCLUSIVE = "EXCLUSIVE",
	UNSPECIFIED = "UNSPECIFIED"
}
export const enum StripeTiersMode {
	GRADUATED = "GRADUATED",
	VOLUME = "VOLUME"
}
export const enum StripeRound {
	UP = "UP",
	DOWN = "DOWN"
}
export const enum StripeType {
	RECURRING = "RECURRING",
	ONE_TIME = "ONE_TIME"
}

type ZEUS_VARIABLES = {
	["StripesetDefaultPaymentMethodInput"]: ValueTypes["StripesetDefaultPaymentMethodInput"];
	["StripeAttachPaymentMethodInput"]: ValueTypes["StripeAttachPaymentMethodInput"];
	["StripeCreateConnectAccountInput"]: ValueTypes["StripeCreateConnectAccountInput"];
	["StripeConnectAccountBusinessType"]: ValueTypes["StripeConnectAccountBusinessType"];
	["StripeConnectAccountType"]: ValueTypes["StripeConnectAccountType"];
	["StripeBankAccountInput"]: ValueTypes["StripeBankAccountInput"];
	["StripeBankAccountHolderType"]: ValueTypes["StripeBankAccountHolderType"];
	["StripeSubscriptionFilter"]: ValueTypes["StripeSubscriptionFilter"];
	["StripeSubStatus"]: ValueTypes["StripeSubStatus"];
	["StripeInitStripeCustomerInput"]: ValueTypes["StripeInitStripeCustomerInput"];
	["StripeCreateNewUserCheckoutSessionInput"]: ValueTypes["StripeCreateNewUserCheckoutSessionInput"];
	["StripeCreateCheckoutSessionInput"]: ValueTypes["StripeCreateCheckoutSessionInput"];
	["StripeApplicationFeeInput"]: ValueTypes["StripeApplicationFeeInput"];
	["StripeProductInput"]: ValueTypes["StripeProductInput"];
	["StripeCreateCustomerPortalInput"]: ValueTypes["StripeCreateCustomerPortalInput"];
	["StripeAddressInput"]: ValueTypes["StripeAddressInput"];
	["StripeProductFilter"]: ValueTypes["StripeProductFilter"];
	["StripeRecurringFilter"]: ValueTypes["StripeRecurringFilter"];
	["StripePriceFilter"]: ValueTypes["StripePriceFilter"];
	["StripeBillingScheme"]: ValueTypes["StripeBillingScheme"];
	["StripeTimestamp"]: ValueTypes["StripeTimestamp"];
	["StripeTimestampFilter"]: ValueTypes["StripeTimestampFilter"];
	["StripeAnyObject"]: ValueTypes["StripeAnyObject"];
	["StripeAggregateUsage"]: ValueTypes["StripeAggregateUsage"];
	["StripeInterval"]: ValueTypes["StripeInterval"];
	["StripeUsageType"]: ValueTypes["StripeUsageType"];
	["StripeTaxBehaviour"]: ValueTypes["StripeTaxBehaviour"];
	["StripeTiersMode"]: ValueTypes["StripeTiersMode"];
	["StripeRound"]: ValueTypes["StripeRound"];
	["StripeType"]: ValueTypes["StripeType"];
}