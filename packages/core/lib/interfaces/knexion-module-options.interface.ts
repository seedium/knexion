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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<KnexionModuleOptions> | KnexionModuleOptions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
  extraProviders?: Provider[];
}
