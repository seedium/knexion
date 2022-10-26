import {
  ExecutionContext,
  RepositoryInterceptor,
  RepositoryInterceptorNext,
} from '@knexion/core';
import {
  ListPaginationSelectDatabaseOptions,
  PagePaginationInterceptorOptions,
} from '../interfaces';
import { map, Observable } from 'rxjs';

export class PagePaginationInterceptor<TRecord, TResult>
  implements RepositoryInterceptor<TRecord, TResult>
{
  constructor(private readonly options?: PagePaginationInterceptorOptions) {}

  public intercept(
    context: ExecutionContext<
      TRecord,
      TResult,
      ListPaginationSelectDatabaseOptions<TRecord, TResult>
    >,
    next: RepositoryInterceptorNext<TResult[]>,
  ): Observable<unknown> {
    const { page = 0, limit = this.options?.defaultLimit ?? 20 } =
      context.options;
    const offset = page * limit;
    context.queryBuilder.limit(limit).offset(offset);

    if (this.options?.transform ?? true) {
      return next.handle().pipe(
        map((data) => ({
          data,
        })),
      );
    }

    return next.handle();
  }
}
