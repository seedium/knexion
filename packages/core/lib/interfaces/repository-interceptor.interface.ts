import { Observable } from 'rxjs';
import { ExecutionContext } from '../execution-context';
import { DatabaseOptions } from './database-options.interface';

export interface RepositoryInterceptorNext<T = unknown> {
  handle(): Observable<T>;
}

export interface RepositoryInterceptor<
  TRecord = any,
  TResult = any,
  Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
    TRecord,
    TResult
  >,
  TInput = unknown,
  TOutput = TInput,
> {
  intercept(
    context: ExecutionContext<TRecord, TResult, Options>,
    next: RepositoryInterceptorNext<TInput>,
  ): Observable<TOutput> | Promise<Observable<TOutput>>;
}

export type RepositoryInterceptors<
  TRecord = any,
  TResult = any,
  Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
    TRecord,
    TResult
  >,
> = RepositoryInterceptor<TRecord, TResult, Options>[];
