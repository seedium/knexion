import { DynamicModule, Module, Type } from '@nestjs/common';
import { KnexionModuleAsyncOptions, KnexionModuleOptions } from './interfaces';
import { KnexionCoreModule } from './knexion-core.module';
import { createKnexionProviders } from './knexion.providers';

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
    const providers = createKnexionProviders(repositories);
    return {
      module: KnexionModule,
      providers: providers,
      exports: providers,
    };
  }
}
