import { Observable } from 'rxjs';
import {
  addPrefixColumn,
  ExecutionContext,
  RepositoryInterceptor,
  RepositoryInterceptorNext,
  SelectDatabaseOptions,
} from '@knexion/core';
import { SoftDeleteOptions } from '../interfaces';

export class FilterSoftDeletedInterceptor<TRecord, TResult>
  implements RepositoryInterceptor<TRecord, TResult>
{
  constructor(private readonly options: SoftDeleteOptions<TRecord> = {}) {}

  public intercept(
    context: ExecutionContext<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    next: RepositoryInterceptorNext,
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
