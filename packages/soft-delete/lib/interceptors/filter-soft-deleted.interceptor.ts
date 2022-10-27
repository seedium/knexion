import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  KnexionContext,
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
    context: KnexionContext<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    next: KnexionCallHandler,
  ): Observable<unknown> {
    context.queryBuilder.whereNull(
      addPrefixColumn(
        (this.options.field as string) ?? 'deleted_at',
        context.options.alias,
      ),
    );
    return next.handle();
  }
}
