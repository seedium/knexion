import { Knex } from 'knex';
import { RepositoryInterceptors } from './repository-interceptor.interface';

export interface AliasableRepositoryDatabaseOptions {
  alias?: string;
}

export interface DatabaseOptions<TRecord, TResult, Options = unknown> {
  transaction?: Knex.Transaction;
  intercept?: RepositoryInterceptors<TRecord, TResult, Options>;
}

export interface SelectDatabaseOptions<TRecord, TResult>
  extends DatabaseOptions<
      TRecord,
      TResult,
      SelectDatabaseOptions<TRecord, TResult>
    >,
    AliasableRepositoryDatabaseOptions {
  [field: string]: unknown;
}
