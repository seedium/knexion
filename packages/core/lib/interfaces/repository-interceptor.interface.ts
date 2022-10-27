import { Observable } from 'rxjs';
import { KnexionContext } from '../knexion-context';
import { DatabaseOptions } from './database-options.interface';

export interface KnexionCallHandler<T = unknown> {
  handle(): Observable<T>;
}

export interface KnexionInterceptor<
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
    context: KnexionContext<TRecord, TResult, Options>,
    next: KnexionCallHandler<TInput>,
  ): Observable<TOutput> | Promise<Observable<TOutput>>;
}

export type KnexionInterceptors<
  TRecord = any,
  TResult = any,
  Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
    TRecord,
    TResult
  >,
> = KnexionInterceptor<TRecord, TResult, Options>[];
