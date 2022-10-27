import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import { Knex } from 'knex';

export interface KnexionModuleOptions extends Knex.Config {
  /**
   * Number of times to retry connecting
   * Default: 10
   */
  retryAttempts?: number;
  /**
   * Delay between connection retry attempts (ms)
   * Default: 3000
   */
  retryDelay?: number;
  /**
   * Function that determines whether the module should
   * attempt to connect upon failure.
   *
   * @param err error that was thrown
   * @returns whether to retry connection or not
   */
  toRetry?: (err: any) => boolean;
  /**
   * If `true`, will show verbose error messages on each connection retry.
   */
  verboseRetryLog?: boolean;
}

export interface KnexionOptionsFactory {
  createKnexOptions(): Promise<KnexionModuleOptions> | KnexionModuleOptions;
}

export interface KnexionModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<KnexionOptionsFactory>;
  useClass?: Type<KnexionOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<KnexionModuleOptions> | KnexionModuleOptions;
  inject?: any[];
  extraProviders?: Provider[];
}
