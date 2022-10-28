import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  KnexionExecutionContext,
  KnexionInterceptor,
  KnexionCallHandler,
  SelectDatabaseOptions,
} from '@knexion/core';
import { SoftDeleteOptions } from '../interfaces';

export class FilterSoftDeletedInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult>
{
  constructor(private readonly options: SoftDeleteOptions<TRecord> = {}) {}

  public intercept(
    context: KnexionExecutionContext<TRecord, TResult>,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    const queryBuilder = context.switchToKnex().getQueryBuilder();
    const options =
      context
        .switchToKnex()
        .getOptions<SelectDatabaseOptions<TRecord, TResult>>() ?? {};
    queryBuilder.whereNull(
      addPrefixColumn(
        (this.options.field as string) ?? 'deleted_at',
        options.alias,
      ),
    );
    return next.handle();
  }
}
