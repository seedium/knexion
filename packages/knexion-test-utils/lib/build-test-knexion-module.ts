import { KnexionModule } from '@knexion/core';
import { generateDatabaseConnectionOptions } from './get-knex';
import { DynamicModule } from '@nestjs/common';

export const buildTestKnexionModule = (): DynamicModule =>
  KnexionModule.forRoot({
    client: 'pg',
    connection: generateDatabaseConnectionOptions(),
  });
