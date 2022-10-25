import { DynamicModule, Module, Type } from '@nestjs/common';
import { KnexionModuleAsyncOptions, KnexionModuleOptions } from './interfaces';
import { KnexionCoreModule } from './knexion-core.module';
import { createKnexProviders } from './knexion.providers';

@Module({})
export class KnexionModule {
  static forRoot(options?: KnexionModuleOptions): DynamicModule {
    return {
      module: KnexionModule,
      imports: [KnexionCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: KnexionModuleAsyncOptions): DynamicModule {
    return {
      module: KnexionModule,
      imports: [KnexionCoreModule.forRootAsync(options)],
    };
  }

  static forFeature(repositories?: Type[]): DynamicModule {
    const providers = createKnexProviders(repositories);
    return {
      module: KnexionModule,
      providers: providers,
      exports: providers,
    };
  }
}
