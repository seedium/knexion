import {
  DatabaseOptions,
  SelectDatabaseOptions,
} from './database-options.interface';
import { Knex } from 'knex';

export type KnexionContextType = 'knex';

export type KnexionMethodType =
  | 'list'
  | 'create'
  | 'retrieve'
  | 'update'
  | 'delete';

export interface KnexMethodArgumentsHost<TRecord, TResult> {
  getQueryBuilder(): Knex.QueryBuilder<TRecord, TResult>;
  getOptions(): unknown;
}

export interface ListKnexMethodArgumentsHost<TRecord, TResult>
  extends KnexMethodArgumentsHost<TRecord, TResult> {
  getOptions<
    Options extends SelectDatabaseOptions<
      TRecord,
      TResult
    > = SelectDatabaseOptions<TRecord, TResult>,
  >(): Options;
}

export interface CreateKnexMethodArgumentsHost<TRecord, TResult>
  extends KnexMethodArgumentsHost<TRecord, TResult> {
  getPayload<T = any>(): T;
  getOptions<
    Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
      TRecord,
      TResult
    >,
  >(): Options;
}

export interface RetrieveKnexMethodArgumentsHost<TRecord, TResult, IdType>
  extends KnexMethodArgumentsHost<TRecord, TResult> {
  getId(): IdType;
  getOptions<
    Options extends SelectDatabaseOptions<
      TRecord,
      TResult
    > = SelectDatabaseOptions<TRecord, TResult>,
  >(): Options;
}

export interface UpdateKnexMethodArgumentsHost<TRecord, TResult, IdType>
  extends KnexMethodArgumentsHost<TRecord, TResult> {
  getId(): IdType;
  getPayload<T = any>(): T;
  getOptions<
    Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
      TRecord,
      TResult
    >,
  >(): Options;
}

export interface DeleteKnexMethodArgumentsHost<TRecord, TResult, IdType>
  extends KnexMethodArgumentsHost<TRecord, TResult> {
  getId(): IdType;
  getOptions<
    Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
      TRecord,
      TResult
    >,
  >(): Options;
}

export interface KnexArgumentsHost<TRecord, TResult, IdType> {
  getQueryBuilder(): Knex.QueryBuilder<TRecord, TResult>;
  getRawBuilder(): Knex.RawBuilder<TRecord, TResult>;
  createQueryBuilder(): Knex.QueryBuilder<TRecord, TResult>;
  getOptions<
    Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
      TRecord,
      TResult
    >,
  >(): Options;
  switchToList(): ListKnexMethodArgumentsHost<TRecord, TResult>;
  switchToCreate(): CreateKnexMethodArgumentsHost<TRecord, TResult>;
  switchToRetrieve(): RetrieveKnexMethodArgumentsHost<TRecord, TResult, IdType>;
  switchToUpdate(): UpdateKnexMethodArgumentsHost<TRecord, TResult, IdType>;
  switchToDelete(): DeleteKnexMethodArgumentsHost<TRecord, TResult, IdType>;
}

/**
 * Provides methods for retrieving the arguments being passed to a handler.
 */
export interface KnexionArgumentsHost<TRecord, TResult, IdType> {
  /**
   * Returns the array of arguments being passed to the handler.
   */
  getArgs<T extends Array<any> = any[]>(): T;
  /**
   * Returns a particular argument by index.
   * @param index index of argument to retrieve
   */
  getArgByIndex<T = any>(index: number): T;

  /**
   * Returns the current execution context type (string)
   */
  getType<TContext extends string = KnexionContextType>(): TContext;

  /**
   * Returns the current execution method type (string)
   */
  getMethod<TMethod extends string = KnexionMethodType>(): TMethod;

  switchToKnex(): KnexArgumentsHost<TRecord, TResult, IdType>;
}
