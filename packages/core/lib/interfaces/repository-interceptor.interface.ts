import { Observable } from 'rxjs';
import { ExecutionContext } from '../execution-context';

export interface RepositoryInterceptorNext<T = unknown> {
  handle(): Observable<T>;
}

export interface RepositoryInterceptor<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TRecord = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TResult = any,
  TInput = unknown,
  TOutput = TInput,
> {
  intercept(
    context: ExecutionContext<TRecord, TResult>,
    next: RepositoryInterceptorNext<TInput>,
  ): Observable<TOutput> | Promise<Observable<TOutput>>;
}

export type RepositoryInterceptors<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TRecord = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TResult = any,
> = RepositoryInterceptor<TRecord, TResult>[];
