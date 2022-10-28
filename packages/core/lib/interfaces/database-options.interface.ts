import { Knex } from 'knex';
import { KnexionInterceptors } from './repository-interceptor.interface';

export interface AliasableDatabaseOptions {
  alias?: string;
}

export interface DatabaseOptions<TRecord, TResult> {
  transaction?: Knex.Transaction;
  intercept?: KnexionInterceptors<TRecord, TResult>;
}

export interface SelectDatabaseOptions<TRecord, TResult>
  extends DatabaseOptions<TRecord, TResult>,
    AliasableDatabaseOptions {
  [field: string]: unknown;
}
