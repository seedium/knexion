import { Knex } from 'knex';
import { DatabaseOptions } from './interfaces';

export class ExecutionContext<
  TRecord,
  TResult = unknown,
  Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
    TRecord,
    TResult
  >,
> {
  get queryBuilder(): Knex.QueryBuilder<TRecord, TResult> {
    return this._queryBuilder;
  }

  get rawBuilder(): Knex.RawBuilder<TRecord, TResult> {
    return this._rawBuilder;
  }

  get options(): Options {
    return this._options ?? ({} as Options);
  }

  constructor(
    public readonly buildQueryBuilder: (
      trx?: Knex.Transaction,
    ) => Knex.QueryBuilder<TRecord, TResult>,
    private readonly _queryBuilder: Knex.QueryBuilder<TRecord, TResult>,
    private readonly _rawBuilder: Knex.RawBuilder<TRecord, TResult>,
    private readonly _constructorRef: Function,
    private readonly _handler?: Function,
    private readonly _options?: Options,
  ) {}

  public getClass(): Function {
    return this._constructorRef;
  }

  public getHandler(): Function | undefined {
    return this._handler;
  }
}
