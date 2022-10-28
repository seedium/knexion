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
import { PageList, PagePaginationInterceptor } from '../lib';

describe('PagePaginationInterceptor', () => {
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

  const generateTestRecords = async (count: number) =>
    Promise.all(
      new Array(count).fill(0).map(async () => {
        const [record] = await knex(testTableName).insert(
          { foo: faker.random.word() },
          '*',
        );
        return record;
      }),
    );

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

  test('should apply offset 0 and limit 20', async () => {
    await generateTestRecords(21);
    const result = await testRepository.list<TestRecord, PageList<TestRecord>>({
      intercept: [new PagePaginationInterceptor()],
    });
    expect(result.data.length).toBe(20);
  });

  test('should use custom default limit 2', async () => {
    await generateTestRecords(3);
    const result = await testRepository.list<TestRecord, PageList<TestRecord>>({
      intercept: [new PagePaginationInterceptor({ defaultLimit: 2 })],
    });
    expect(result.data.length).toBe(2);
  });

  test('should use custom limit from options', async () => {
    await generateTestRecords(3);
    const result = await testRepository.list<TestRecord, PageList<TestRecord>>({
      intercept: [new PagePaginationInterceptor()],
      limit: 2,
    });
    expect(result.data.length).toBe(2);
  });

  test('should apply offset', async () => {
    await generateTestRecords(1);
    const result = await testRepository.list<TestRecord, PageList<TestRecord>>({
      intercept: [new PagePaginationInterceptor()],
      limit: 1,
      page: 1,
    });
    expect(result.data.length).toBe(0);
  });

  test('should not transform result', async () => {
    const result = await testRepository.list({
      intercept: [new PagePaginationInterceptor({ transform: false })],
    });
    expect(Array.isArray(result)).toBe(true);
  });
});
