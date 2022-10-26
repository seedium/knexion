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
import { FilterTimestampInterceptor } from '../lib';

describe('FilterTimestampInterceptor', () => {
  const {
    name: testTableName,
    init,
    forFeature,
    createTable,
    dropTable,
    truncate,
  } = buildTestRepository({
    createTable: (table) => {
      table.integer('created_at').notNullable();
    },
  });
  let app: TestingModule;
  let knex: Knex;
  let testRepository: TestRepository<TestRecord & { created_at: number }>;

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

  test('should filter by simple timestamp', async () => {
    const fakeFoo = faker.random.word();
    const now = Math.round(Date.now() / 1000);
    const [fixtureRecord] = await knex(testTableName).insert(
      { foo: fakeFoo, created_at: now },
      '*',
    );
    const result = await testRepository.list({
      intercept: [new FilterTimestampInterceptor('created_at')],
      created_at: now,
    });
    expect(result).toStrictEqual([fixtureRecord]);
  });
});
