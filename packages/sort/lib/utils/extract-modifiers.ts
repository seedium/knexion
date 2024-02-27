import { addPrefixColumn } from '@knexion/core';

interface SortModifiers {
  column: string;
  placeholder: string;
  placeholderBindings: string[];
  where: string;
  whereBindings: string[];
}

const buildJsonPlaceholder = (
  column: string,
  jsonPath: string[],
): [string, string[]] => {
  const [lastProperty] = jsonPath.splice(-1);
  if (!jsonPath.length) {
    return [`??->>?`, [column, lastProperty]];
  }
  return [
    `??->${jsonPath.map(() => '??').join('->')}->>?`,
    [column, ...jsonPath, lastProperty],
  ];
};

const getPlaceholder = (path: string, alias?: string): [string, string[]] => {
  const [column, ...jsonPath] = path.split('->');
  const isJsonPlaceholder = !!jsonPath.length;

  if (column.startsWith('skipAlias:')) {
    const columnName = column.slice(10);
    return isJsonPlaceholder
      ? buildJsonPlaceholder(columnName, jsonPath)
      : ['??', [columnName]];
  }

  const aliasedColumn =
    column.split('.').length > 1 ? column : addPrefixColumn(column, alias);
  return isJsonPlaceholder
    ? buildJsonPlaceholder(aliasedColumn, jsonPath)
    : ['??', [aliasedColumn]];
};

const lookupModifiers = (
  definitions: string[],
  alias?: string,
): SortModifiers => {
  const [placeholder, placeholderBindings] = getPlaceholder(
    definitions[0],
    alias,
  );

  const where =
    definitions
      .find((definition) => definition.startsWith('where:'))
      ?.slice(6) ?? placeholder;
  const whereBindings =
    definitions
      .find((definition) => definition.startsWith('whereBindings:'))
      ?.slice(14)
      .split(',') ?? [];

  return {
    column: placeholderBindings[0],
    placeholder,
    placeholderBindings,
    where,
    whereBindings,
  };
};

export const extractModifiers = (
  path: string,
  alias?: string,
): SortModifiers => {
  const definitions = path.split(';');

  if (definitions.length > 1) {
    return lookupModifiers(definitions, alias);
  }

  const [placeholder, placeholderBindings] = getPlaceholder(
    definitions[0],
    alias,
  );
  return {
    column: placeholderBindings[0],
    placeholder,
    placeholderBindings,
    where: placeholder,
    whereBindings: placeholderBindings,
  };
};
