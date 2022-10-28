import { Knex } from 'knex';
import { ModuleRef, Reflector } from '@nestjs/core';
import { OnModuleInit, Type } from '@nestjs/common';
import {
  KNEXION_INTERCEPTORS,
  KNEXION_REPOSITORY_OPTIONS,
} from './knexion.constants';
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
import { KnexionExecutionContextHost } from './helpers';

export interface DefaultRepositoryOptions {
  idType: string | number;
  omitCreateFields?: string;
  omitUpdateFields?: string;
}

export class Repository<
  TRecord,
  RepositoryOptions extends DefaultRepositoryOptions = DefaultRepositoryOptions,
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
    return await this.createQueryRunner(
      this.queryBuilder().select(addPrefixColumn('*', options?.alias)),
      options,
      [],
      this.list,
    );
  }

  public async create(
    createPayload: Omit<
      TRecord,
      TakeField<RepositoryOptions, 'omitCreateFields'>
    >,
    options?: DatabaseOptions<TRecord, TRecord>,
  ): Promise<TRecord> {
    const [record] = (await this.createQueryRunner(
      this.queryBuilder().insert(createPayload as any, '*'),
      options,
      [createPayload],
      this.create,
    )) as TRecord[];
    return record;
  }

  public async retrieve<TResult = TRecord>(
    id: RepositoryOptions['idType'],
    options?: SelectDatabaseOptions<TRecord, TResult>,
  ): Promise<TResult | null> {
    options = this.addAliasToOptions(options);
    const record = await this.createQueryRunner(
      this.queryBuilder()
        .select(addPrefixColumn('*', options?.alias))
        .where(addPrefixColumn('id', options?.alias), id)
        .first(),
      options,
      [id],
      this.retrieve,
    );
    if (!record) {
      return null;
    }
    return record as TResult;
  }

  public async update(
    id: RepositoryOptions['idType'],
    updatePayload: Partial<
      Omit<TRecord, TakeField<RepositoryOptions, 'omitUpdateFields'>>
    >,
    options?: DatabaseOptions<TRecord, TRecord>,
  ): Promise<TRecord | null> {
    const [record] = (await this.createQueryRunner(
      this.queryBuilder()
        .where('id', id)
        .update(updatePayload as any, '*'),
      options,
      [id, updatePayload],
      this.update,
    )) as TRecord[];
    if (!record) {
      return null;
    }
    return record as TRecord;
  }

  public async delete(
    id: RepositoryOptions['idType'],
    options?: DatabaseOptions<TRecord, TRecord>,
  ): Promise<TRecord | null> {
    const [record] = (await this.createQueryRunner(
      this.queryBuilder<TRecord>().where('id', id).del('*'),
      options,
      [id],
      this.delete,
    )) as TRecord[];
    if (!record) {
      return null;
    }
    return record as TRecord;
  }

  public async createQueryRunner<TResult, TOutput>(
    queryBuilder: Knex.QueryBuilder<TRecord, TResult>,
    options?: DatabaseOptions<TRecord, unknown>,
    args: any[] = [],
    handler?: Function,
  ): Promise<TOutput> {
    if (options?.transaction) {
      queryBuilder.transacting(options.transaction);
    }
    const context = new KnexionExecutionContextHost<
      TRecord,
      TResult,
      RepositoryOptions['idType']
    >(
      [
        queryBuilder,
        this.rawBuilder(options?.transaction),
        () => this.queryBuilder(options?.transaction),
        options,
        ...args,
      ],
      this.constructor as Type,
      handler,
    );
    context.setMethod(handler?.name);
    return this.augmentQueryBuilder(queryBuilder, context) as Promise<TOutput>;
  }

  public queryBuilder<TResult>(
    trx?: Knex.Transaction,
  ): Knex.QueryBuilder<TRecord, TResult> {
    const queryBuilder = this.knex<TRecord, TResult>(this.options.name);
    if (trx) {
      queryBuilder.transacting(trx);
    }
    return queryBuilder;
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
    const interceptors =
      this.reflector.get<
        | KnexionInterceptors<TRecord, unknown>
        | Type<KnexionInterceptor<TRecord, unknown>>[]
      >(KNEXION_INTERCEPTORS, this.constructor) ?? [];

    this.interceptors = await Promise.all(
      interceptors.map((interceptor) => {
        if (isFunction(interceptor)) {
          return this.moduleRef.create(interceptor);
        }
        return interceptor;
      }),
    );
  }

  private augmentQueryBuilder<TResult>(
    queryBuilder: Knex.QueryBuilder<TRecord, TResult>,
    context: KnexionExecutionContextHost<
      TRecord,
      TResult,
      RepositoryOptions['idType']
    >,
  ): Knex.QueryBuilder<TRecord, TResult> {
    const options: DatabaseOptions<TRecord, TResult> | undefined = context
      .switchToKnex()
      .getOptions();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const repositoryRef = this;
    const originalThen = queryBuilder.then;
    // @ts-expect-error we need to override only current instance of query builder
    queryBuilder.then = async function () {
      // eslint-disable-next-line prefer-rest-params
      const [originalOnResolve, originalOnReject] = arguments;
      try {
        const result = await repositoryRef.interceptorsConsumer.intercept(
          repositoryRef.resolveInterceptors(
            options?.intercept,
            context.getHandler(),
          ),
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

  private resolveInterceptors<TResult>(
    interceptors: KnexionInterceptors<TRecord, TResult> = [],
    handler?: Function,
  ): KnexionInterceptors<TRecord, TResult> {
    const resolvedInterceptors: KnexionInterceptors<TRecord, TResult> = [
      ...interceptors,
    ];

    resolvedInterceptors.unshift(...this.interceptors);

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
      resolvedInterceptors.push(
        ...(methodInterceptors as KnexionInterceptors<TRecord, TResult>),
      );
    }

    return resolvedInterceptors;
  }
}
