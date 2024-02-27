import { Observable } from 'rxjs';
import {
  KnexionExecutionContext,
  KnexionCallHandler,
  KnexionInterceptor,
  SelectDatabaseOptions,
} from '@knexion/core';
import { extractModifiers, getSortDirection } from '../utils';
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
        const [direction, path] = getSortDirection(property);
        const { placeholder, placeholderBindings } = extractModifiers(
          path,
          options.alias,
        );
        queryBuilder.orderByRaw(
          `${placeholder} ${direction} nulls ${
            direction === 'desc' ? 'last' : 'first'
          }`,
          placeholderBindings,
        );
      });
    }

    return next.handle();
  }
}
