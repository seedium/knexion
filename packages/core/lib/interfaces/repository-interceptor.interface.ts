import { Observable } from 'rxjs';
import { KnexionExecutionContext } from './knexion-execution-contex.interface';

export interface KnexionCallHandler<T = unknown> {
  handle(): Observable<T>;
}

export interface KnexionInterceptor<
  TRecord = any,
  TResult = any,
  TInput = unknown,
  TOutput = TInput,
> {
  intercept(
    context: KnexionExecutionContext<TRecord, TResult>,
    next: KnexionCallHandler<TInput>,
  ): Observable<TOutput> | Promise<Observable<TOutput>>;
}

export type KnexionInterceptors<
  TRecord = any,
  TResult = any,
> = KnexionInterceptor<TRecord, TResult>[];
