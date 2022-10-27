import {
  buildTestKnexionModule,
  buildTestRepository,
  getKnex,
  TestRepository,
} from 'knexion-test-utils';
import { Test, TestingModule } from '@nestjs/testing';
import { Knex } from 'knex';
import { FieldTransform, FieldTransformInterceptor } from '../lib';
import { faker } from '@faker-js/faker';
import { UseKnexionInterceptors } from '@knexion/core/lib';
import { KNEXION_INTERCEPTORS } from '@knexion/core/lib/knexion.constants';
import { FIELD_TRANSFORM_SCHEMA } from '../lib/transform.constants';

describe('FieldTransformInterceptor', () => {
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
    Reflect.deleteMetadata(KNEXION_INTERCEPTORS, TestRepository);
    Reflect.deleteMetadata(FIELD_TRANSFORM_SCHEMA, TestRepository);
  });

  test('should transform field foo', async () => {
    const fakeTransformed = faker.random.word();
    UseKnexionInterceptors(FieldTransformInterceptor)(TestRepository);
    FieldTransform({ schema: { foo: () => fakeTransformed } })(TestRepository);
    await testRepository.onModuleInit();
    const [fixtureRecord] = await knex(testTableName).insert(
      { foo: faker.random.word() },
      '*',
    );
    const result = await testRepository.list();
    expect(result).toMatchObject([{ ...fixtureRecord, foo: fakeTransformed }]);
  });
});
