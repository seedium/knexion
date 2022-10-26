import {
  buildTestKnexionModule,
  buildTestRepository,
  getKnex,
  TestRecord,
  TestRepository,
} from 'knexion-test-utils';
import { Test, TestingModule } from '@nestjs/testing';
import { Knex } from 'knex';
import { faker } from '@faker-js/faker';
import { FilterSoftDeletedInterceptor } from '../lib';

describe('FilterSoftDeletedInterceptor', () => {
  const {
    name: testTableName,
    init,
    forFeature,
    createTable,
    dropTable,
    truncate,
  } = buildTestRepository({
    createTable: (table) => {
      table.integer('deleted_at');
    },
  });
  let app: TestingModule;
  let knex: Knex;
  let testRepository: TestRepository<
    TestRecord & { deleted_at: number | null }
  >;

  beforeAll(async () => {
    knex = await getKnex();
    init(knex);
    await createTable();
    app = await Test.createTestingModule({
      imports: [buildTestKnexionModule(), forFeature()],
    }).compile();
    testRepository = app.get(TestRepository);
  });
  afterAll(async () => {
    await app.close();
    await dropTable();
    await knex.destroy();
  });
  afterEach(async () => {
    await truncate();
  });

  test('should not return deleted records', async () => {
    await knex(testTableName).insert(
      { foo: faker.random.word(), deleted_at: 1 },
      '*',
    );
    const result = await testRepository.list({
      intercept: [new FilterSoftDeletedInterceptor()],
    });
    expect(result).toStrictEqual([]);
  });
});
