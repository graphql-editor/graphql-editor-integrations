export const argumentsToDotted = (args: any = {}) => {
  const values: Record<string, any> = {};
  const insertVariables = (args: Record<string, unknown>, prefix = '') => {
    Object.entries(args).map(([k, v]) => {
      if (v !== null && !Array.isArray(v) && typeof v === 'object') {
        insertVariables(v as Record<string, unknown>, `${prefix}${k}.`);
        return;
      }
      const key = `${prefix}${k}`;
      values[key] = v;
    });
  };
  insertVariables(args);
  return values;
};
