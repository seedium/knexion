import { defer, from, isObservable, lastValueFrom, Observable } from 'rxjs';
import { mergeAll, switchMap } from 'rxjs/operators';
import { KnexionCallHandler } from './interfaces';
import { KnexionContext } from './knexion-context';

export class InterceptorsConsumer<TRecord> {
  public async intercept(
    context: KnexionContext<TRecord>,
    next: () => Promise<unknown>,
  ): Promise<unknown> {
    const { intercept: interceptors = [] } = context.options;
    if (!interceptors.length) {
      return next();
    }
    const start$ = defer(() => this.transformDeferred(next));
    const nextFn =
      (i = 0) =>
      async () => {
        if (i >= interceptors.length) {
          return start$;
        }
        const handler: KnexionCallHandler = {
          handle: () => from(nextFn(i + 1)()).pipe(mergeAll()),
        };
        return interceptors[i].intercept(context, handler);
      };
    const resultOrDeferred = await nextFn()();
    return this.transformToResult(resultOrDeferred);
  }

  private transformDeferred(next: () => Promise<unknown>): Observable<unknown> {
    return from(next()).pipe(
      switchMap((res) => {
        const isDeferred = res instanceof Promise || res instanceof Observable;
        return isDeferred ? res : Promise.resolve(res);
      }),
    );
  }

  private async transformToResult(resultOrDeferred: unknown): Promise<unknown> {
    if (isObservable(resultOrDeferred)) {
      return lastValueFrom(resultOrDeferred);
    }
    return resultOrDeferred;
  }
}
