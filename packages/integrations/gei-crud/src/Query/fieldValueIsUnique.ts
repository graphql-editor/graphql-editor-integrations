import { FieldResolveInput } from 'stucco-js';
import objects from './objects.js';

export const fieldValueIsUnique = async (input: FieldResolveInput) => {
  const data = { model: input.arguments ? (input.arguments.collection as string) : 'TeamCollection' };

  if (input.arguments?.caseInsensitive) {
    const argument: Record<string, any> = {};
    argument[(input.arguments?.fieldName as string) || 'name'] = input.arguments?.fieldValue;
    return !((await objects({ ...input, data, arguments: argument }))?.length > 0);
  }
  const fieldFilter: Record<string, any> = {};
  fieldFilter[(input.arguments?.fieldName as string) || 'name'] = input.arguments?.fieldValue;
  return !((await objects({ ...input, data, arguments: { fieldFilter } }))?.length > 0);
};
export default fieldValueIsUnique;
