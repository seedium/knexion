import { Observable } from 'rxjs';
import {
  KnexionExecutionContext,
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
    context: KnexionExecutionContext<TRecord, TResult>,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const queryBuilder = context.switchToKnex().getQueryBuilder();
    const options = context
      .switchToKnex()
      .getOptions<SelectDatabaseOptions<TRecord, TResult>>();
    const sort = options[this.options.optionKey ?? 'sort'];

    if (sort && Array.isArray(sort)) {
      sort.forEach((property) => {
        const [direction, column] = getSortDirection(property);
        queryBuilder.orderBy(
          addPrefixColumn(column, options.alias),
          direction,
          direction === 'desc' ? 'last' : 'first',
        );
      });
    }

    return next.handle();
  }
}
