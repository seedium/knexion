import {
  DynamicModule,
  Global,
  Logger,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import knex, { Knex } from 'knex';
import { lastValueFrom, defer } from 'rxjs';
import { InjectKnex } from './decorators';
import {
  KnexionModuleAsyncOptions,
  KnexionModuleOptions,
  KnexionOptionsFactory,
} from './interfaces';
import { KNEX, KNEX_MODULE_OPTIONS } from './knexion.constants';
import { handleRetry } from './knexion.utils';
import { KnexionTransactionService } from './services';

@Global()
@Module({})
export class KnexionCoreModule implements OnApplicationShutdown {
  static forRoot(options: KnexionModuleOptions = {}): DynamicModule {
    const typeOrmModuleOptions = {
      provide: KNEX_MODULE_OPTIONS,
      useValue: options,
    };

    const knexProvider = {
      provide: KNEX,
      useFactory: async () => await this.createKnexProvider(options),
    };

    return {
      module: KnexionCoreModule,
      providers: [
        typeOrmModuleOptions,
        knexProvider,
        KnexionTransactionService,
      ],
      exports: [knexProvider, KnexionTransactionService],
    };
  }

  static forRootAsync(options: KnexionModuleAsyncOptions): DynamicModule {
    const knexProvider = {
      provide: KNEX,
      useFactory: (options: KnexionModuleOptions) =>
        this.createKnexProvider(options),
      inject: [KNEX_MODULE_OPTIONS],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: KnexionCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        knexProvider,
        KnexionTransactionService,
        ...(options.extraProviders || []),
      ],
      exports: [knexProvider, KnexionTransactionService],
    };
  }

  private static async createKnexProvider(
    options: KnexionModuleOptions,
  ): Promise<Knex> {
    const { retryAttempts, retryDelay, verboseRetryLog, toRetry, ...config } =
      options;
    return await lastValueFrom(
      defer(async () => {
        const knexInstance = knex(config);
        await knexInstance.raw(`select 1+1 as result`);
        return knexInstance;
      }).pipe(handleRetry(retryAttempts, retryDelay, verboseRetryLog, toRetry)),
    );
  }

  private static createAsyncProviders(
    options: KnexionModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<KnexionOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: KnexionModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: KNEX_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<KnexOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass || options.useExisting) as Type<KnexionOptionsFactory>,
    ];
    return {
      provide: KNEX_MODULE_OPTIONS,
      useFactory: async (optionsFactory: KnexionOptionsFactory) =>
        await optionsFactory.createKnexOptions(),
      inject,
    };
  }

  private readonly logger = new Logger('KnexModule');

  constructor(@InjectKnex() private readonly knex: Knex) {}

  public async onApplicationShutdown(): Promise<void> {
    try {
      await this.knex.destroy();
    } catch (err) {
      this.logger.error(err);
    }
  }
}
