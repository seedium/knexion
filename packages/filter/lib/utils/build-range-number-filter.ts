import { Knex } from 'knex';
import { RangeNumberFilter } from '../interfaces';

const getQueryForDateOperator = (
  queryBuilder: Knex.QueryBuilder,
  name: string,
  operator: 'gt' | 'gte' | 'lt' | 'lte',
  value: number,
): void => {
  if (operator === 'gt') {
    queryBuilder.where(name, '>', value);
  } else if (operator === 'gte') {
    queryBuilder.where(name, '>=', value);
  } else if (operator === 'lt') {
    queryBuilder.where(name, '<', value);
  } else if (operator === 'lte') {
    queryBuilder.where(name, '<=', value);
  }
};

export const buildRangeNumberFilter = (
  queryBuilder: Knex.QueryBuilder,
  name: string,
  numberFilter: RangeNumberFilter,
): void => {
  Object.entries(numberFilter).forEach(([operator, value]) =>
    getQueryForDateOperator(
      queryBuilder,
      name as string,
      operator as 'gt' | 'gte' | 'lt' | 'lte',
      value,
    ),
  );
};
