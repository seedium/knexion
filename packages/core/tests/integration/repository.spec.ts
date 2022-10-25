import { Knex } from 'knex';
import { generateDatabaseConnectionOptions, getKnex } from '../utils';
import { EntityRepository, KnexionModule, Repository } from '../../lib';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';

const testTableName = faker.word.noun().toLowerCase();

@EntityRepository({ name: testTableName })
class TestRepository extends Repository<
  { id: number; foo: string | null },
  { idType: number; omitCreateFields: 'id'; omitUpdateFields: 'id' }
> {}

describe('Repository', () => {
  let knex: Knex;
  let testRepository: TestRepository;
  let app: TestingModule;
  beforeAll(async () => {
    knex = await getKnex();
    await knex.schema.createTable(testTableName, (table) => {
      table.increments('id').primary();
      table.string('foo');
    });
    app = await Test.createTestingModule({
      imports: [
        KnexionModule.forRoot({
          client: 'pg',
          connection: generateDatabaseConnectionOptions(),
        }),
        KnexionModule.forFeature([TestRepository]),
      ],
    }).compile();
    testRepository = app.get(TestRepository);
  });
  afterAll(async () => {
    await knex.schema.dropTable(testTableName);
    await knex.destroy();
    await app.close();
  });
  afterEach(async () => {
    await knex(testTableName).truncate();
  });
  describe('list', () => {
    test('should retrieve empty array', async () => {
      const result = await testRepository.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    test('should retrieve 1 record', async () => {
      await knex(testTableName).insert({ foo: faker.random.word() });
      const result = await testRepository.list();
      expect(result.length).toBe(1);
    });
  });
  describe('create', () => {
    test('should insert new record', async () => {
      const fakeCreatePayload = { foo: faker.random.word() };
      const result = await testRepository.create(fakeCreatePayload);
      expect(result).toMatchObject(fakeCreatePayload);
    });
  });
  describe('retrieve', () => {
    test('should return one record', async () => {
      const [fixtureRecord] = await knex(testTableName).insert(
        { foo: faker.random.word() },
        '*',
      );
      const result = await testRepository.retrieve(fixtureRecord.id);
      expect(result).toStrictEqual(fixtureRecord);
    });
    test('should return null if record missed', async () => {
      const result = await testRepository.retrieve(1);
      expect(result).toBeNull();
    });
    test('should use explicit alias', async () => {
      const [fixtureRecord] = await knex(testTableName).insert(
        { foo: faker.random.word() },
        '*',
      );
      const result = await testRepository.retrieve(fixtureRecord.id, {
        alias: testTableName,
      });
      expect(result).toStrictEqual(fixtureRecord);
    });
  });
  describe('update', () => {
    test('should update record', async () => {
      const [fixtureRecord] = await knex(testTableName).insert(
        { foo: faker.random.word() },
        '*',
      );
      const fakeUpdatePayload = { foo: faker.random.word() };
      const result = await testRepository.update(
        fixtureRecord.id,
        fakeUpdatePayload,
      );
      expect(result).toStrictEqual({
        ...fixtureRecord,
        ...fakeUpdatePayload,
      });
    });
    test('should return null if record missed', async () => {
      const result = await testRepository.update(1, {
        foo: faker.random.word(),
      });
      expect(result).toBeNull();
    });
  });
  describe('delete', () => {
    test('should delete record', async () => {
      const [fixtureRecord] = await knex(testTableName).insert(
        { foo: faker.random.word() },
        '*',
      );
      await testRepository.delete(fixtureRecord.id);
      const result = await knex(testTableName).select('*');
      expect(result.length).toBe(0);
    });
    test('should return null if record missed', async () => {
      const result = await testRepository.delete(1);
      expect(result).toBeNull();
    });
  });
  describe('raw builder', () => {
    test('should retrieve raw builder wrapped with transaction', async () => {
      const trx = await knex.transaction();
      await testRepository.rawBuilder(trx)('select * from ' + testTableName);
      await trx.commit();
    });
  });
});
