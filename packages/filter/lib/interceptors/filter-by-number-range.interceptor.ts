import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  KnexionExecutionContext,
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
    context: KnexionExecutionContext<TRecord, TResult>,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const { useAlias = true } = this.options;
    const options = context
      .switchToKnex()
      .getOptions<SelectDatabaseOptions<TRecord, TResult>>();
    const queryBuilder = context.switchToKnex().getQueryBuilder();
    const column = useAlias
      ? addPrefixColumn(this.name as string, options.alias)
      : (this.name as string);
    buildRangeNumberFilter(queryBuilder, column, this.value);
    return next.handle();
  }
}
