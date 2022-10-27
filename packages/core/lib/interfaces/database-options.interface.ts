import { Knex } from 'knex';
import { KnexionInterceptors } from './repository-interceptor.interface';

export interface AliasableDatabaseOptions {
  alias?: string;
}

export interface DatabaseOptions<TRecord, TResult, Options = unknown> {
  transaction?: Knex.Transaction;
  intercept?: KnexionInterceptors<TRecord, TResult, Options>;
}

export interface SelectDatabaseOptions<TRecord, TResult>
  extends DatabaseOptions<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    AliasableDatabaseOptions {
  [field: string]: unknown;
}
