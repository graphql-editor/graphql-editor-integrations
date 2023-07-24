import { FieldResolveInput } from 'stucco-js';
import { getResolverData } from './shared.js';

export const prepareSourceParameters = (input: FieldResolveInput) => {
  const source = input.source;
  const { data } = getResolverData<{ sourceParameters?: string[] }>(input);
  const sourceParameters = data?.sourceParameters?.value;
  if (sourceParameters && sourceParameters.length > 0) {
    if (!source) {
      throw new Error(
        'Invalid input. This resolver work only if it is piped from other resolver. Either make it correct way or remove sourceParameters from resolver',
      );
    }
    const s = source as Record<string, any>;
    return Object.fromEntries(
      sourceParameters.map((sp) => {
        const sourceParamValue = s[sp];
        if (!sourceParamValue) {
          throw new Error(
            `Parameter "${sp}" does not exist on object ${JSON.stringify(
              s,
              null,
              2,
            )}. Please change sourceParam name or provide correct source from piped resolver.`,
          );
        }
        return [sp, sourceParamValue];
      }),
    );
  }
  return {};
};
export const prepareModel = (input: FieldResolveInput) => {
  const { data } = getResolverData<{ model: string }>(input);
  const model = data?.model.value;
  if (!model) {
    throw new Error('Please specify a database model name');
  }
  return model;
};
export const prepareRelatedModel = (input: FieldResolveInput) => {
  const { data } = getResolverData<{ relatedModel: string }>(input);
  const model = data?.relatedModel.value;
  if (!model) {
    throw new Error('Please specify a related model name');
  }
  return model;
};

export const prepareRelatedField = (input: FieldResolveInput) => {
  const { data } = getResolverData<{ relatedField: string }>(input);
  const model = data?.relatedField.value;
  if (!model) {
    throw new Error('Please specify a related field');
  }
  return model;
};
export const prepareRequired_id = (input: FieldResolveInput) => {
  const _id = input.arguments?._id as string;
  if (!_id) {
    throw new Error(`"_id" parameter is required on this field`);
  }
  return _id;
};
