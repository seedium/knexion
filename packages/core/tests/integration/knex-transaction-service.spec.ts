import { KnexionTransactionService } from '../../lib';
import { Knex } from 'knex';
import { getKnex } from '../utils';
import { faker } from '@faker-js/faker';

const fixtureTableName = faker.word.noun().toLowerCase();

describe('KnexTransactionService', () => {
  let knex: Knex;
  let knexTransactionService: KnexionTransactionService;

  beforeAll(async () => {
    knex = await getKnex();
    knexTransactionService = new KnexionTransactionService(knex);
    await knex.schema.createTable(fixtureTableName, (table) => {
      table.increments('id');
      table.string('foo').unique();
    });
  });
  afterAll(async () => {
    await knex.schema.dropTable(fixtureTableName);
    await knex.destroy();
  });

  test('should create transaction', async () => {
    const trx = await knexTransactionService.transaction();
    expect(trx).toBeTruthy();
    await trx.commit();
  });

  test('should create transaction with deferred constraints', async () => {
    const fixtureChildTableName = faker.word.noun().toLowerCase();
    await knex.schema.createTable(fixtureChildTableName, (table) => {
      table.increments('id');
      table
        .integer('ref')
        .references('id')
        .inTable(fixtureTableName)
        .deferrable('deferred');
    });
    const trx = await knexTransactionService.transaction({
      deferred: [`${fixtureChildTableName}_ref_foreign`],
    });
    expect(trx).toBeTruthy();
    await trx.commit();
    await knex.schema.dropTable(fixtureChildTableName);
  });
});
