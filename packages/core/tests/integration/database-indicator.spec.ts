import { DatabaseHealthIndicator } from '../..';
import knexFactory, { Knex } from 'knex';
import { HealthCheckError } from '@nestjs/terminus';
import { getKnex } from 'knexion-test-utils';

describe('Database Indicator', () => {
  let knex: Knex;
  let databaseHealthIndicator: DatabaseHealthIndicator;
  beforeAll(async () => {
    knex = await getKnex();
  });
  afterAll(async () => {
    await knex.destroy();
  });
  beforeEach(() => {
    databaseHealthIndicator = new DatabaseHealthIndicator(knex);
  });
  test('should return healthy status if connection healthy', async () => {
    await expect(databaseHealthIndicator.isHealthy()).resolves.toMatchObject({
      database: { status: 'up' },
    });
  });
  test('should throw "HealthCheckError" error if connection lost', async () => {
    const brokenDatabaseHealthIndicator = new DatabaseHealthIndicator(
      knexFactory({
        client: 'pg',
      }),
    );
    await expect(brokenDatabaseHealthIndicator.isHealthy()).rejects.toThrow(
      HealthCheckError,
    );
  });
});
