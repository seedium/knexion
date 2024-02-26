import { addPrefixColumn } from '@knexion/core';

const buildJsonSortPath = (
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

export const buildSortPath = (
  path: string,
  alias?: string,
): [string, string[]] => {
  const [column, ...jsonPath] = path.split('->');
  const prefixedColumn =
    column.split('.').length > 1 ? column : addPrefixColumn(column, alias);
  if (!jsonPath.length) {
    return ['??', [prefixedColumn]];
  }
  return buildJsonSortPath(prefixedColumn, jsonPath);
};
