import { createParserField, getTypeName, Parser, ParserField, TypeDefinition, ValueDefinition } from 'graphql-js-tree';
export const inputsFromResolver = ({ schema, type, field }: { schema: string; type: string; field: string }) => {
  const tree = Parser.parseAddExtensions(schema);
  const fields = tree.nodes.find((n) => n.name === type)?.args.find((a) => a.name === field)?.args;
  if (!fields) return [];

  const insertVariables = (inputArguments: ParserField[], prefix = ''): ParserField[] =>
    inputArguments.flatMap((v) => {
      const k = v.name;
      const typeName = getTypeName(v.type.fieldType);
      const typeNode = tree.nodes.find((n) => n.name === typeName);
      const isInput = typeNode?.data.type === TypeDefinition.InputObjectTypeDefinition;
      if (isInput) {
        return insertVariables(typeNode.args, `${prefix}${k}.`);
      }
      const key = `${prefix}${k}`;
      return createParserField({
        name: key,
        type: {
          fieldType: v.type.fieldType,
        },
        data: {
          type: ValueDefinition.InputValueDefinition,
        },
      });
    });

  const inputs = insertVariables(fields);
  return inputs;
};
