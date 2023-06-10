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
        const [direction, path] = getSortDirection(property);
        queryBuilder.orderByRaw(
          `${addPrefixColumn(
            this.buildPath(path),
            options.alias,
          )} ${direction} nulls ${direction === 'desc' ? 'last' : 'first'}`,
        );
      });
    }

    return next.handle();
  }

  private buildPath(path: string): string {
    const [column, ...jsonPath] = path.split('.');
    if (!jsonPath.length) {
      return path;
    }
    return `${column}->>${jsonPath
      .map((property) => `'${property}'`)
      .join('->>')}`;
  }
}
