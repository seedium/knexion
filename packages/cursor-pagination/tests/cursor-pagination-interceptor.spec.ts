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
import { PageList, CursorPaginationInterceptor, PageInfo } from '../lib';

interface TestRecordTimestamp extends TestRecord {
  created_at: number;
}

const encodePageInfo = (info: PageInfo<number>) => {
  return Buffer.from(JSON.stringify(info)).toString('base64');
};

describe('CursorPaginationInterceptor', () => {
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
  let testRepository: TestRepository<TestRecordTimestamp>;

  const createTestRecord = async () => {
    const [record] = await knex(testTableName).insert(
      {
        foo: faker.random.word(),
        created_at: Math.round(Date.now() / 1000),
      },
      '*',
    );
    return record;
  };

  const generateTestRecords = async (
    count: number,
    { strictOrder = false } = {},
  ) => {
    const emptyArray = new Array(count).fill(0);
    if (strictOrder) {
      for (const index in emptyArray) {
        emptyArray[index] = await createTestRecord();
      }
      return emptyArray;
    } else {
      return Promise.all(emptyArray.map(async () => createTestRecord()));
    }
  };

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

  test('should return page with default limit', async () => {
    await generateTestRecords(21);
    const result = await testRepository.list<
      TestRecordTimestamp,
      PageList<TestRecordTimestamp>
    >({
      intercept: [new CursorPaginationInterceptor()],
    });
    expect(result.data.length).toBe(20);
    expect(result.has_more_next).toBe(true);
    expect(result.has_more_previous).toBe(false);
  });

  it('should paginate next page', async () => {
    const [first, second, third, fourth, fifth, sixth] =
      await generateTestRecords(6, { strictOrder: true });
    const firstPage = await testRepository.list<
      TestRecordTimestamp,
      PageList<TestRecordTimestamp>
    >({
      intercept: [new CursorPaginationInterceptor()],
      limit: 2,
    });
    expect(firstPage).toStrictEqual({
      data: [first, second],
      has_more_next: true,
      has_more_previous: false,
    });

    const secondPage = await testRepository.list<
      TestRecordTimestamp,
      PageList<TestRecordTimestamp>
    >({
      intercept: [new CursorPaginationInterceptor()],
      limit: 2,
      page_after: encodePageInfo({
        id: firstPage.data[1].id,
        created_at: firstPage.data[1].created_at,
      }),
    });
    expect(secondPage).toStrictEqual({
      data: [third, fourth],
      has_more_next: true,
      has_more_previous: true,
    });

    const thirdPage = await testRepository.list<
      TestRecordTimestamp,
      PageList<TestRecordTimestamp>
    >({
      intercept: [new CursorPaginationInterceptor()],
      limit: 2,
      page_after: encodePageInfo({
        id: secondPage.data[1].id,
        created_at: secondPage.data[1].created_at,
      }),
    });
    expect(thirdPage).toStrictEqual({
      data: [fifth, sixth],
      has_more_next: false,
      has_more_previous: true,
    });
  });

  it('should paginate previous page', async () => {
    const [first, second, third, fourth, fifth] = await generateTestRecords(6, {
      strictOrder: true,
    });
    const firstPage = await testRepository.list<
      TestRecordTimestamp,
      PageList<TestRecordTimestamp>
    >({
      intercept: [new CursorPaginationInterceptor()],
      limit: 2,
      page_before: encodePageInfo({
        id: fifth.id,
        created_at: fifth.created_at,
      }),
    });
    expect(firstPage).toStrictEqual({
      data: [third, fourth],
      has_more_next: true,
      has_more_previous: true,
    });

    const secondPage = await testRepository.list<
      TestRecordTimestamp,
      PageList<TestRecordTimestamp>
    >({
      intercept: [new CursorPaginationInterceptor()],
      limit: 2,
      page_before: encodePageInfo({
        id: firstPage.data[0].id,
        created_at: firstPage.data[0].created_at,
      }),
    });
    expect(secondPage).toStrictEqual({
      data: [first, second],
      has_more_next: true,
      has_more_previous: false,
    });
  });
});
