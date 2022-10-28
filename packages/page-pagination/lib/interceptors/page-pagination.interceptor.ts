import {
  KnexionExecutionContext,
  KnexionInterceptor,
  KnexionCallHandler,
} from '@knexion/core';
import {
  ListPaginationSelectDatabaseOptions,
  PagePaginationInterceptorOptions,
} from '../interfaces';
import { map, Observable } from 'rxjs';

export class PagePaginationInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult>
{
  constructor(private readonly options?: PagePaginationInterceptorOptions) {}

  public intercept(
    context: KnexionExecutionContext<TRecord, TResult>,
    next: KnexionCallHandler<TResult[]>,
  ): Observable<unknown> {
    const { page = 0, limit = this.options?.defaultLimit ?? 20 } =
      context
        .switchToKnex()
        .getOptions<ListPaginationSelectDatabaseOptions<TRecord, TResult>>() ??
      {};
    const queryBuilder = context.switchToKnex().getQueryBuilder();
    const offset = page * limit;
    queryBuilder.limit(limit).offset(offset);

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
