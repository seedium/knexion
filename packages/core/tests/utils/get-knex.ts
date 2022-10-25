import knex, { Knex } from 'knex';

export const generateDatabaseConnectionOptions =
  (): Knex.PgConnectionConfig => ({
    port: 5432,
    host: process.env.POSTGRES_HOST || 'localhost',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'example',
    database: process.env.POSTGRES_DB || 'test_integration',
  });

let knexInstance: Knex;

export const getKnex = async (): Promise<Knex> => {
  if (!knexInstance) {
    knexInstance = knex({
      client: 'pg',
      connection: generateDatabaseConnectionOptions(),
    });
    await knexInstance.raw(`select 1+1 as result`);
  }
  return knexInstance;
};
