import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  KnexionContext,
  KnexionInterceptor,
  KnexionCallHandler,
  SelectDatabaseOptions,
} from '@knexion/core';
import { FilterOptions } from '../interfaces';

type FilterByArrayOperator = 'in' | string;

export class FilterByArrayInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult>
{
  constructor(
    private readonly name: keyof TRecord,
    private readonly value: string[],
    private readonly operator: FilterByArrayOperator = 'in',
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
    if (this.operator === 'in') {
      context.queryBuilder.whereIn(column, this.value);
    } else {
      context.queryBuilder.where(column, this.operator, this.value);
    }
    return next.handle();
  }
}
