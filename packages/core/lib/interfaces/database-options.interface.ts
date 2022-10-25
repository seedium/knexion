import { Knex } from 'knex';
import { RepositoryInterceptors } from './repository-interceptor.interface';

export interface AliasableRepositoryDatabaseOptions {
  alias?: string;
}

export interface DatabaseOptions<TRecord, TResult> {
  transaction?: Knex.Transaction;
  intercept?: RepositoryInterceptors<TRecord, TResult>;
}

export interface SelectDatabaseOptions<TRecord, TResult>
  extends DatabaseOptions<TRecord, TResult>,
    AliasableRepositoryDatabaseOptions {}
