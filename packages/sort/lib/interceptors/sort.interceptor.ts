import { Observable } from 'rxjs';
import {
  ExecutionContext,
  RepositoryInterceptorNext,
  RepositoryInterceptor,
  addPrefixColumn,
  SelectDatabaseOptions,
} from '@knexion/core';
import { getSortDirection } from '../utils';
import { SortOptions } from '../interfaces';

export class SortInterceptor<TRecord, TResult>
  implements RepositoryInterceptor<TRecord, TResult>
{
  constructor(private readonly options: SortOptions = {}) {}

  public intercept(
    context: ExecutionContext<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    next: RepositoryInterceptorNext,
  ): Observable<unknown> {
    const sortOptionKey = this.options.optionKey ?? 'sort';
    const sort = context.options[sortOptionKey];

    if (!Array.isArray(sort)) {
      throw new Error(`'${sortOptionKey}' is not array`);
    }

    if (sort) {
      sort.forEach((property) => {
        const [direction, column] = getSortDirection(property);
        context.queryBuilder.orderBy(
          addPrefixColumn(column, context.options.alias),
          direction,
          direction === 'desc' ? 'last' : 'first',
        );
      });
    }

    return next.handle();
  }
}