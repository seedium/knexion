import { Knex } from 'knex';
import { ModuleRef, Reflector } from '@nestjs/core';
import { OnModuleInit, Type } from '@nestjs/common';
import {
  KNEXION_INTERCEPTORS,
  KNEXION_REPOSITORY_OPTIONS,
} from './knexion.constants';
import { KnexionContext } from './knexion-context';
import { addPrefixColumn } from './utils';
import {
  DatabaseOptions,
  KnexionRepositoryOptions,
  KnexionInterceptor,
  KnexionInterceptors,
  SelectDatabaseOptions,
  TakeField,
} from './interfaces';
import { InjectKnex } from './decorators';
import { InterceptorsConsumer } from './interceptors-consumer';
import { isFunction } from './utils/internal';

export interface RepositoryOptions {
  idType: string | number;
  omitCreateFields?: string;
  omitUpdateFields?: string;
}

export class Repository<
  TRecord,
  Options extends RepositoryOptions = RepositoryOptions,
> implements OnModuleInit
{
  private readonly options: KnexionRepositoryOptions;
  private interceptors: KnexionInterceptors<TRecord, unknown> = [];
  private readonly interceptorsConsumer: InterceptorsConsumer<TRecord>;

  constructor(
    @InjectKnex()
    protected readonly knex: Knex,
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {
    const options = this.reflector.get<KnexionRepositoryOptions | undefined>(
      KNEXION_REPOSITORY_OPTIONS,
      this.constructor,
    );
    if (!options) {
      throw new Error(
        'Repository is not initialized with decorators @KnexionRepository',
      );
    }
    this.options = options;
    this.interceptorsConsumer = new InterceptorsConsumer();
  }

  public async list<TResult = TRecord, TOutput = TResult[]>(
    options?: SelectDatabaseOptions<TRecord, TResult>,
  ): Promise<TOutput> {
    options = this.addAliasToOptions(options);
    return (await this.queryBuilder(options, this.list).select(
      addPrefixColumn('*', options?.alias),
    )) as Promise<TOutput>;
  }

  public async create(
    createPayload: Omit<TRecord, TakeField<Options, 'omitCreateFields'>>,
    options?: DatabaseOptions<TRecord, TRecord>,
  ): Promise<TRecord> {
    const [record] = await this.queryBuilder<TRecord>(
      options,
      this.create,
    ).insert(createPayload as any, '*');
    return record as TRecord;
  }

  public async retrieve<TResult = TRecord>(
    id: Options['idType'],
    options?: SelectDatabaseOptions<TRecord, TResult>,
  ): Promise<TResult | null> {
    options = this.addAliasToOptions(options);
    const record = await this.queryBuilder(options, this.retrieve)
      .select(addPrefixColumn('*', options?.alias))
      .where(addPrefixColumn('id', options?.alias), id)
      .first();
    if (!record) {
      return null;
    }
    return record as TResult;
  }

  public async update(
    id: Options['idType'],
    updatePayload: Partial<
      Omit<TRecord, TakeField<Options, 'omitUpdateFields'>>
    >,
    options?: DatabaseOptions<TRecord, TRecord>,
  ): Promise<TRecord | null> {
    const [record] = await this.queryBuilder<TRecord>(options, this.update)
      .where('id', id)
      .update(updatePayload as any, '*');
    if (!record) {
      return null;
    }
    return record as TRecord;
  }

  public async delete(
    id: Options['idType'],
    options?: DatabaseOptions<TRecord, TRecord>,
  ): Promise<TRecord | null> {
    const [record] = await this.queryBuilder<TRecord>(options, this.delete)
      .where('id', id)
      .del('*');
    if (!record) {
      return null;
    }
    return record as TRecord;
  }

  public queryBuilder<
    TResult,
    Options extends DatabaseOptions<TRecord, TResult> = DatabaseOptions<
      TRecord,
      TResult
    >,
  >(
    options?: Options,
    handler?: Function,
  ): Knex.QueryBuilder<TRecord, TResult> {
    const queryBuilder = this.pureQueryBuilder(options?.transaction);
    return this.augmentQueryBuilder(queryBuilder, options, handler);
  }

  public rawBuilder<TResult>(
    trx?: Knex.Transaction,
  ): Knex.RawBuilder<TRecord, TResult>;
  public rawBuilder<TResult>(
    trx?: Knex.Transaction,
  ): (
    valueOrSql: any,
    ...bindings: readonly Knex.RawBinding[]
  ) => Knex.Raw<TResult> {
    return (
      valueOrSql: any,
      ...bindings: readonly Knex.RawBinding[]
    ): Knex.Raw<TResult> => {
      const rawBuilder = this.knex.raw(valueOrSql, ...bindings);
      if (trx) {
        rawBuilder.transacting(trx);
      }
      return rawBuilder;
    };
  }

  public pureQueryBuilder<TResult>(
    trx?: Knex.Transaction,
  ): Knex.QueryBuilder<TRecord, TResult> {
    const queryBuilder = this.knex<TRecord, TResult>(this.options.name);
    if (trx) {
      queryBuilder.transacting(trx);
    }
    return queryBuilder;
  }

  public addAliasToOptions<TResult>(
    options?: SelectDatabaseOptions<TRecord, TResult>,
  ): SelectDatabaseOptions<TRecord, TResult> {
    if (!options) {
      return { alias: this.options.name };
    }
    return {
      ...options,
      alias: this.options.name,
    };
  }

  public async onModuleInit(): Promise<void> {
    await this.resolveInterceptors();
  }

  private async resolveInterceptors(): Promise<void> {
    const interceptors =
      this.reflector.get<
        | KnexionInterceptors<TRecord, unknown>
        | Type<KnexionInterceptor<TRecord, unknown>>[]
      >(KNEXION_INTERCEPTORS, this.constructor) ?? [];

    this.interceptors = await Promise.all(
      interceptors.map((inteceptor) => {
        if (isFunction(inteceptor)) {
          return this.createInterceptor(inteceptor);
        }
        return inteceptor;
      }),
    );
  }

  private async createInterceptor(
    interceptorType: Type<KnexionInterceptor<TRecord, unknown>>,
  ): Promise<KnexionInterceptor<TRecord, unknown>> {
    return this.moduleRef.create(interceptorType);
  }

  private augmentQueryBuilder<
    TResult,
    Options extends DatabaseOptions<TRecord, TResult>,
  >(
    queryBuilder: Knex.QueryBuilder<TRecord, TResult>,
    options?: Options,
    handler?: Function,
  ): Knex.QueryBuilder<TRecord, TResult> {
    const context = new KnexionContext(
      (trx?: Knex.Transaction) => this.pureQueryBuilder(trx),
      queryBuilder,
      this.rawBuilder(options?.transaction),
      this.constructor,
      handler,
      this.resolveOptions(options, handler),
    );

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const repositoryRef = this;
    const originalThen = queryBuilder.then;
    // @ts-expect-error we need to override only current instance of query builder
    queryBuilder.then = async function () {
      // eslint-disable-next-line prefer-rest-params
      const [originalOnResolve, originalOnReject] = arguments;
      try {
        const result = await repositoryRef.interceptorsConsumer.intercept(
          context,
          () =>
            new Promise((resolve, reject) => {
              const onResolve = (result: unknown) => resolve(result);
              const onReject = (err: Error) => reject(err);
              return originalThen.apply(this, [onResolve, onReject]);
            }),
        );
        originalOnResolve(result);
      } catch (err) {
        originalOnReject(err);
      }
    };

    return queryBuilder;
  }

  private resolveOptions<
    TResult,
    Options extends DatabaseOptions<TRecord, TResult>,
  >(options?: Options, handler?: Function): Options {
    if (!options) {
      options = {
        intercept: [] as KnexionInterceptors<TRecord, TResult>,
      } as Options;
    }

    if (!options.intercept) {
      options.intercept = [];
    }

    options.intercept?.unshift(...this.interceptors);

    if (handler) {
      const methodInterceptors =
        this.reflector.get<
          | KnexionInterceptors<TRecord, TResult>
          | Type<KnexionInterceptor<TRecord, TResult>>[]
        >(KNEXION_INTERCEPTORS, handler) ?? [];
      /*
       * TODO since moduleRef.create function is very expensive and very slow it's very undesirable to do it in runtime. What options we have:
       *  Option 1. Just ignore type interceptors and throw error like below
       *  Option 2. Reflect interceptors for each method and bootstrap them in `onModuleInit` hook like it done with repository interceptors
       * */
      const isSomeInterceptorNotBootstrapped = methodInterceptors.some(
        (maybeTypeInterceptor) => isFunction(maybeTypeInterceptor),
      );
      if (isSomeInterceptorNotBootstrapped) {
        throw new Error(
          'Passing type of interceptor to bootstrap on nestjs side currently is not supported. Please creare instance on interceptor and pass to interceptors',
        );
      }
      options.intercept?.push(
        ...(methodInterceptors as KnexionInterceptors<TRecord, TResult>),
      );
    }

    return options;
  }
}
