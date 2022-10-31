import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  KnexionExecutionContext,
  KnexionInterceptor,
  KnexionCallHandler,
  SelectDatabaseOptions,
} from '@knexion/core';
import { FilterObject, FilterObjectOptions } from '../interfaces';
import { isPlainObject, isUndefined } from '@nestjs/common/utils/shared.utils';

export class FilterInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult>
{
  constructor(private readonly options: FilterObjectOptions = {}) {}

  public intercept(
    context: KnexionExecutionContext<TRecord, TResult>,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const queryBuilder = context.switchToKnex().getQueryBuilder();
    const options = context
      .switchToKnex()
      .getOptions<SelectDatabaseOptions<TRecord, TResult>>();
    const filterObject = options[this.options.optionKey ?? 'filter'];
    if (isPlainObject(filterObject)) {
      queryBuilder.where(
        this.appendAliasToFilterColumns(
          filterObject as FilterObject<TRecord>,
          options.alias,
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
      Object.entries(filter)
        .filter(([, value]) => !isUndefined(value))
        .map(([name, value]) => {
          const { useAlias = true } = this.options;
          const column = useAlias ? addPrefixColumn(name, alias) : name;
          return [column, value];
        }),
    );
  }
}
