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
import { SortInterceptor } from '../lib';

describe('SortInterceptor', () => {
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

  test('should sort by ascending order', async () => {
    const [[firstFixtureRecord], [secondFixtureRecord]] = await Promise.all([
      knex(testTableName).insert({ foo: faker.random.word(), bar: 1 }, '*'),
      knex(testTableName).insert({ foo: faker.random.word(), bar: 2 }, '*'),
    ]);
    const result = await testRepository.list({
      intercept: [new SortInterceptor()],
      sort: ['bar'],
    });
    expect(result).toStrictEqual([firstFixtureRecord, secondFixtureRecord]);
  });

  test('should sort by descending order', async () => {
    const [[firstFixtureRecord], [secondFixtureRecord]] = await Promise.all([
      knex(testTableName).insert({ foo: faker.random.word(), bar: 1 }, '*'),
      knex(testTableName).insert({ foo: faker.random.word(), bar: 2 }, '*'),
    ]);
    const result = await testRepository.list({
      intercept: [new SortInterceptor()],
      sort: ['-bar'],
    });
    expect(result).toStrictEqual([secondFixtureRecord, firstFixtureRecord]);
  });
});
