import { Observable } from 'rxjs';
import { Knex } from 'knex';
import {
  addPrefixColumn,
  KnexionContext,
  KnexionInterceptor,
  KnexionCallHandler,
  SelectDatabaseOptions,
} from '@knexion/core';
import { RangeNumberFilter, TimestampFilter } from '../interfaces';

export class FilterTimestampInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult>
{
  constructor(private readonly timestampField: keyof TRecord) {}

  public intercept(
    context: KnexionContext<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    if (!context.options[this.timestampField as string]) {
      return next.handle();
    }
    const timestampFilter = context.options[this.timestampField as string];
    if (this.isNumber(timestampFilter)) {
      context.queryBuilder.where(
        addPrefixColumn('created_at', context.options.alias),
        timestampFilter,
      );
    } else {
      this.buildComplexDateFilterQuery(
        context.queryBuilder,
        timestampFilter,
        context.options,
      );
    }
    return next.handle();
  }

  private isNumber(dateFilter: number | TimestampFilter): dateFilter is number {
    return typeof dateFilter === 'number';
  }

  private buildComplexDateFilterQuery(
    queryBuilder: Knex.QueryBuilder<TRecord, TResult>,
    dateFilter: RangeNumberFilter,
    options: SelectDatabaseOptions<TRecord, TResult>,
  ): void {
    Object.entries(dateFilter).forEach(([operator, value]) =>
      this.getQueryForDateOperator(
        queryBuilder,
        operator as 'gt' | 'gte' | 'lt' | 'lte',
        value,
        options.alias,
      ),
    );
  }

  private getQueryForDateOperator(
    queryBuilder: Knex.QueryBuilder<TRecord, TResult>,
    operator: 'gt' | 'gte' | 'lt' | 'lte',
    value: number,
    alias?: string,
  ): void {
    const createdAtColumnName = addPrefixColumn('created_at', alias);
    if (operator === 'gt') {
      queryBuilder.where(createdAtColumnName, '>', value);
    } else if (operator === 'gte') {
      queryBuilder.where(createdAtColumnName, '>=', value);
    } else if (operator === 'lt') {
      queryBuilder.where(createdAtColumnName, '<', value);
    } else if (operator === 'lte') {
      queryBuilder.where(createdAtColumnName, '<=', value);
    }
  }
}
