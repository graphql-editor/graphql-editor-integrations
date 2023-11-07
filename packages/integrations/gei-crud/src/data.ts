import { FieldResolveInput } from 'stucco-js';
import { DataInput } from './integration.js';
import { getResolverData } from './shared.js';

export const prepareSourceParameters = (input: FieldResolveInput & Partial<DataInput>) => {
  const source = input.source;
  let sourceParameters = input.data?.sourceParameters;
  if (!sourceParameters) {
    const { data } = getResolverData<{ sourceParameters?: string[]; sourceFilterParameters?: string[] }>(input);
    sourceParameters = data?.sourceParameters?.value || data?.sourceFilterParameters?.value;
  }
  if (sourceParameters && sourceParameters.length > 0) {
    if (!source) {
      throw new Error(
        'Invalid input. This resolver work only if it is piped from other resolver. Either make it correct way or remove sourceFilterParameters from resolver',
      );
    }
    const s = source as Record<string, any>;
    return Object.fromEntries(
      sourceParameters.map((spStringObject: string) => {
        let sourceParamValue: any = undefined;
        let returnParameter = '';
        const spStringObjectAr = spStringObject.replace(/[{ }]/g, '').split(':');
        const returnParameterName = spStringObjectAr.length > 1 ? spStringObjectAr[0] : undefined;
        const spStringPath = returnParameterName ? spStringObjectAr[1] : spStringObjectAr[0];
        const spPath = spStringPath.split('.');
        for (const sp of spPath) {
          sourceParamValue = sourceParamValue ? sourceParamValue[sp] : s[sp];
          returnParameter = sp;
          if (!sourceParamValue) {
            throw new Error(
              `Parameter "${sp}" does not exist on object ${JSON.stringify(
                s,
                null,
                2,
              )}. Please change sourceFilterParameter name or provide correct source from piped resolver.`,
            );
          }
        }
        return [returnParameterName || returnParameter, sourceParamValue];
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
  const model = data?.relatedField?.value;
  if (!model) {
    throw new Error('Please specify a related field');
  }
  return model;
};

export const prepare_id = (input: FieldResolveInput) => {
  const _id = input.arguments?._id as string;
  return _id;
};

export const prepareRequired_id = (input: FieldResolveInput) => {
  const _id = input.arguments?._id;
  if (!_id) {
    throw new Error(`"_id" parameter is required on this field`);
  }
  return _id as string;
};
