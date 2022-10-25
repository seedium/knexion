export const addPrefixColumn = (column: string, alias?: string): string => {
  if (!alias) {
    return column;
  }
  return `${alias}.${column}`;
};
