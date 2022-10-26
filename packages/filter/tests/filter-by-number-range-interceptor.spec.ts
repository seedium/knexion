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
import { FilterByNumberRangeInterceptor } from '../lib';

describe('FilterByNumberRangeInterceptor', () => {
  const {
    name: testTableName,
    init,
    forFeature,
    createTable,
    dropTable,
    truncate,
  } = buildTestRepository({
    createTable: (table) => {
      table.integer('bar').notNullable();
    },
  });
  let app: TestingModule;
  let knex: Knex;
  let testRepository: TestRepository<TestRecord & { bar: number }>;

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

  test('should filter by range', async () => {
    const fakeFoo = faker.random.word();
    const [fixtureRecord] = await knex(testTableName).insert(
      { foo: fakeFoo, bar: 2 },
      '*',
    );
    const result = await testRepository.list({
      intercept: [
        new FilterByNumberRangeInterceptor('bar', {
          gt: 1,
          lte: 2,
        }),
      ],
    });
    expect(result).toStrictEqual([fixtureRecord]);
  });
});
