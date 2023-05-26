import { Observable } from 'rxjs';
import { Knex } from 'knex';
import {
  addPrefixColumn,
  KnexionExecutionContext,
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
    context: KnexionExecutionContext<TRecord, TResult>,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const options = context
      .switchToKnex()
      .getOptions<SelectDatabaseOptions<TRecord, TResult>>();
    const queryBuilder = context.switchToKnex().getQueryBuilder();

    if (!options[this.timestampField as string]) {
      return next.handle();
    }
    const timestampFilter = options[this.timestampField as string];
    if (this.isNumber(timestampFilter)) {
      queryBuilder.where(
        addPrefixColumn(this.timestampField as string, options.alias),
        timestampFilter,
      );
    } else {
      this.buildComplexDateFilterQuery(queryBuilder, timestampFilter, options);
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
    const timestampColumnName = addPrefixColumn(
      this.timestampField as string,
      alias,
    );
    if (operator === 'gt') {
      queryBuilder.where(timestampColumnName, '>', value);
    } else if (operator === 'gte') {
      queryBuilder.where(timestampColumnName, '>=', value);
    } else if (operator === 'lt') {
      queryBuilder.where(timestampColumnName, '<', value);
    } else if (operator === 'lte') {
      queryBuilder.where(timestampColumnName, '<=', value);
    }
  }
}
