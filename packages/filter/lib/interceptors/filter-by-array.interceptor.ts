import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  KnexionExecutionContext,
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
    context: KnexionExecutionContext<TRecord, TResult>,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const { useAlias = true } = this.options;
    const queryBuilder = context.switchToKnex().getQueryBuilder();
    const options = context
      .switchToKnex()
      .getOptions<SelectDatabaseOptions<TRecord, TResult>>();
    const column = useAlias
      ? addPrefixColumn(this.name as string, options.alias)
      : (this.name as string);
    if (this.operator === 'in') {
      queryBuilder.whereIn(column, this.value);
    } else {
      queryBuilder.where(column, this.operator, this.value);
    }
    return next.handle();
  }
}
