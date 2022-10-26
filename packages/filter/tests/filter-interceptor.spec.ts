import {
  buildTestKnexionModule,
  buildTestRepository,
  getKnex,
  TestRepository,
} from 'knexion-test-utils';
import { Test, TestingModule } from '@nestjs/testing';
import { Knex } from 'knex';
import { faker } from '@faker-js/faker';
import { FilterInterceptor } from '../lib';

describe('FilterInterceptor', () => {
  const {
    name: testTableName,
    init,
    forFeature,
    createTable,
    dropTable,
    truncate,
  } = buildTestRepository();
  let app: TestingModule;
  let knex: Knex;
  let testRepository: TestRepository;

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

  test('should filter', async () => {
    const fakeFoo = faker.random.word();
    const [fixtureRecord] = await knex(testTableName).insert(
      { foo: fakeFoo },
      '*',
    );
    const result = await testRepository.list({
      intercept: [new FilterInterceptor()],
      filter: {
        foo: fakeFoo,
      },
    });
    expect(result).toStrictEqual([fixtureRecord]);
  });
});
