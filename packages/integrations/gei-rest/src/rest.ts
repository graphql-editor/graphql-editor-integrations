import { FieldResolveInput } from 'stucco-js';
import fetch from 'node-fetch';
import { getResolverData, getReturnTypeName } from 'graphql-editor-cli';
import fs from 'fs';
import path from 'node:path';
import { inputsFromResolver } from './shared/inputsForResolver.js';
import { replacer } from './shared/replacer.js';
import { argumentsToDotted } from './shared/argumentsToDotted.js';
type RESTConfig = {
  headers?: string[];
  url: string;
  body?: string;
  method?: string;
  passedHeaders?: string[];
};

export const handler = async (input: FieldResolveInput, info: RESTConfig) => {

  if(info){const urlVal = info?.url;
    if (!urlVal) {
      throw new Error('Invalid resolver data please provide url at least');
    }
      const { method = 'GET'  } = info || {};
      const bodyVal = info.body;
      const methodValue = method;
      const headersValue = info.headers;
      const passedHeadersVal = info.passedHeaders;

      const headersComputed = headersValue?.map((v) => v.split(':')).reduce((a, b) => ({ ...a, [b[0]]: b[1] }), {}) || {};
  const inputHeaders = input.protocol?.headers;
  const addHeaders = passedHeadersVal?.map((h) => {
      if (inputHeaders && inputHeaders[h]) {
        return { v: inputHeaders[h][0], k: h };
      }
    })
    .reduce<Record<string, string>>((a, b) => {
      if (!b) return a;
      return {
        ...a,
        [b.k]: b.v,
      };
    }, {});

  const schema = fs.readFileSync(path.join(process.cwd(), 'schema.graphql')).toString('utf-8');
  const type = input.info.parentType && getReturnTypeName(input.info.parentType);
  const inputNodes = type
    ? inputsFromResolver({
        type,
        field: input.info.fieldName,
        schema,
      })
    : [];
  const argumentsInDotted = argumentsToDotted(input.arguments);

  const { body, url } = replacer({
    inputs: argumentsInDotted,
    possibleInputs: inputNodes,
    request: {
      body: bodyVal,
      url: urlVal,
    },
  });

  const response = await fetch(url, {
    headers: {
      ...headersComputed,
      ...addHeaders,
    },
    method: methodValue,
    body,
  });

  const res = {
    ok: response.ok,
    redirected: response.redirected,
    url: response.url,
    statusText: response.statusText,
    type: response.type,
  } as Pick<typeof response, 'ok' | 'redirected' | 'url' | 'statusText' | 'type'>;

  const resHeaders: Record<string, string> = {};
  response.headers.forEach((value, name) => {
    resHeaders[name] = value;
  });

  const computedResponse = {
    ...res,
    headers: resHeaders,
  };

  try {
    if (response.headers.get('content-type')?.startsWith('image/')) {
      return {
        __response: 'image' as const,
        __meta: {
          status: response.status,
          computedResponse,
        },
        response: await response.arrayBuffer(),
      };
    }
    const json = await response.json();
    return {
      __response: 'json' as const,
      response: json,
      __meta: {
        status: response.status,
        computedResponse,
      },
    };
  } catch (error) {
    return {
      __response: 'error' as const,
      __meta: {
        status: response.status,
        computedResponse,
      },
      error,
    };
  }



  // Get resolver data
} else {
  const resolverData = getResolverData<RESTConfig>(input);

  const data = 'data' in resolverData ? resolverData.data : undefined;
  const urlVal = data?.url.value;
  if (!urlVal) {
    throw new Error('Invalid resolver data please provide url at least');
  }

  const { method = { value: 'GET' } } = data || {};
  const bodyVal = data?.body?.value;
  const methodValue = method.value;
  const headersValue = data?.headers?.value;
  const passedHeadersVal = data?.passedHeaders?.value;

  const headersComputed = headersValue?.map((v) => v.split(':')).reduce((a, b) => ({ ...a, [b[0]]: b[1] }), {}) || {};
  const inputHeaders = input.protocol?.headers;
  const addHeaders = passedHeadersVal
    ?.map((h) => {
      if (inputHeaders && inputHeaders[h]) {
        return { v: inputHeaders[h][0], k: h };
      }
    })
    .reduce<Record<string, string>>((a, b) => {
      if (!b) return a;
      return {
        ...a,
        [b.k]: b.v,
      };
    }, {});

  const schema = fs.readFileSync(path.join(process.cwd(), 'schema.graphql')).toString('utf-8');
  const type = input.info.parentType && getReturnTypeName(input.info.parentType);
  const inputNodes = type
    ? inputsFromResolver({
        type,
        field: input.info.fieldName,
        schema,
      })
    : [];
  const argumentsInDotted = argumentsToDotted(input.arguments);

  const { body, url } = replacer({
    inputs: argumentsInDotted,
    possibleInputs: inputNodes,
    request: {
      body: bodyVal,
      url: urlVal,
    },
  });

  const response = await fetch(url, {
    headers: {
      ...headersComputed,
      ...addHeaders,
    },
    method: methodValue,
    body,
  });

  const res = {
    ok: response.ok,
    redirected: response.redirected,
    url: response.url,
    statusText: response.statusText,
    type: response.type,
  } as Pick<typeof response, 'ok' | 'redirected' | 'url' | 'statusText' | 'type'>;

  const resHeaders: Record<string, string> = {};
  response.headers.forEach((value, name) => {
    resHeaders[name] = value;
  });

  const computedResponse = {
    ...res,
    headers: resHeaders,
  };

  try {
    if (response.headers.get('content-type')?.startsWith('image/')) {
      return {
        __response: 'image' as const,
        __meta: {
          status: response.status,
          computedResponse,
        },
        response: await response.arrayBuffer(),
      };
    }
    const json = await response.json();
    return {
      __response: 'json' as const,
      response: json,
      __meta: {
        status: response.status,
        computedResponse,
      },
    };
  } catch (error) {
    return {
      __response: 'error' as const,
      __meta: {
        status: response.status,
        computedResponse,
      },
      error,
    };
  }
};
}