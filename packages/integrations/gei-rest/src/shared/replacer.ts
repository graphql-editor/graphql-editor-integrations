import { Options, ParserField, ScalarTypes } from 'graphql-js-tree';

export const replacer = ({
  inputs,
  possibleInputs,
  request,
}: {
  possibleInputs: ParserField[];
  inputs?: Record<string, any>;
  request: {
    body?: string;
    url: string;
  };
}) => {
  let body = request.body;
  let url = request.url;
  possibleInputs.forEach((inp) => {
    const inputName = inp.name;
    let inputObject = inputs?.[inputName];
    if (!inputObject) {
      if (url.includes(inputName)) {
        throw new Error(`URL contains input variable "${inputName}" which is not provided`);
      }
      const currentReg = new RegExp(`"[^"]*":(\\s+)?\\$${inputName},?\\n?`, 'gm');
      body = body?.replace(currentReg, '');
    } else {
      const { fieldType } = inp.type;
      if (
        (fieldType.type === Options.name && fieldType.name === ScalarTypes.String) ||
        (fieldType.type === Options.required &&
          fieldType.nest.type === Options.name &&
          fieldType.nest.name === ScalarTypes.String)
      ) {
        inputObject = `"${inputObject}"`;
      }
      if (Array.isArray(inputObject)) {
        if (inputObject.length === 0) return `[]`;
        const isString = typeof inputObject[0] === 'string';
        if (isString) {
          inputObject = `[${inputObject.map((i) => `"${i}"`).join(',')}]`;
        } else {
          inputObject = `[${inputObject.join(',')}]`;
        }
      }
      url = url.replace(`\$${inputName}`, inputObject);
      if (body) body = body.replace(`\$${inputName}`, inputObject);
    }
  });
  // remove trailing commas
  const commasRegex = new RegExp(/\,(?=\s*?[\}\]])/);
  if (body) body = body?.replace(commasRegex, '');
  body = body ? JSON.stringify(JSON.parse(body), null, 4) : undefined;
  return {
    url,
    body,
  };
};
