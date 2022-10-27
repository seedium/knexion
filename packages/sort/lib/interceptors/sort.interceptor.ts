import { Observable } from 'rxjs';
import {
  KnexionContext,
  KnexionCallHandler,
  KnexionInterceptor,
  addPrefixColumn,
  SelectDatabaseOptions,
} from '@knexion/core';
import { getSortDirection } from '../utils';
import { SortOptions } from '../interfaces';

export class SortInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult>
{
  constructor(private readonly options: SortOptions = {}) {}

  public intercept(
    context: KnexionContext<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const sortOptionKey = this.options.optionKey ?? 'sort';
    const sort = context.options[sortOptionKey];

    if (sort && Array.isArray(sort)) {
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
