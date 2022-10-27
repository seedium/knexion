import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  KnexionContext,
  KnexionInterceptor,
  KnexionCallHandler,
  SelectDatabaseOptions,
} from '@knexion/core';
import { FilterObject, FilterObjectOptions } from '../interfaces';
import { isPlainObject } from '@nestjs/common/utils/shared.utils';

export class FilterInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult>
{
  constructor(private readonly options: FilterObjectOptions = {}) {}

  public intercept(
    context: KnexionContext<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const filterObject = context.options[this.options.optionKey ?? 'filter'];
    if (isPlainObject(filterObject)) {
      context.queryBuilder.where(
        this.appendAliasToFilterColumns(
          filterObject as FilterObject<TRecord>,
          context.options.alias,
        ),
      );
    }

    return next.handle();
  }

  private appendAliasToFilterColumns(
    filter: Record<string, unknown>,
    alias?: string,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(filter).map(([name, value]) => {
        const { useAlias = true } = this.options;
        const column = useAlias ? addPrefixColumn(name, alias) : name;
        return [column, value];
      }),
    );
  }
}
