import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  KnexionContext,
  KnexionInterceptor,
  KnexionCallHandler,
  SelectDatabaseOptions,
} from '@knexion/core';
import { buildRangeNumberFilter } from '../utils';
import { FilterOptions, RangeNumberFilter } from '../interfaces';

export class FilterByNumberRangeInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult>
{
  constructor(
    private readonly name: keyof TRecord,
    private readonly value: RangeNumberFilter,
    private readonly options: FilterOptions = {},
  ) {}
  public intercept(
    context: KnexionContext<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const { useAlias = true } = this.options;
    const column = useAlias
      ? addPrefixColumn(this.name as string, context.options.alias)
      : (this.name as string);
    buildRangeNumberFilter(context.queryBuilder, column, this.value);
    return next.handle();
  }
}
