import {
  EntityRepository,
  ExecutionContext,
  Repository,
  RepositoryInterceptor,
  RepositoryInterceptorNext,
  UseRepositoryInterceptors,
} from '../../lib';
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';
import { Test, TestingModule } from '@nestjs/testing';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModuleRef, Reflector } from '@nestjs/core';
import {
  buildTestKnexionModule,
  buildTestRepository,
  getKnex,
  TestRepository,
} from 'knexion-test-utils';

describe('Interceptors', () => {
  const {
    name: testTableName,
    init,
    forFeature,
    createTable,
    dropTable,
    truncate,
  } = buildTestRepository();

  let knex: Knex;
  let testRepository: TestRepository;
  let app: TestingModule;

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
    await dropTable();
    await knex.destroy();
    await app.close();
  });

  afterEach(async () => {
    await truncate();
  });

  test('should intercept query with additional select', async () => {
    class TestInterceptor implements RepositoryInterceptor {
      public intercept(
        context: ExecutionContext<any>,
        next: RepositoryInterceptorNext,
      ): Observable<unknown> {
        context.queryBuilder.select(context.rawBuilder('1 as intercepted'));
        return next.handle();
      }
    }
    await knex(testTableName).insert({ foo: faker.random.word() });
    const result = await testRepository.list({
      intercept: [new TestInterceptor() as any],
    });
    expect(result).toMatchObject([{ intercepted: 1 }]);
  });

  test('should intercept result with additional field', async () => {
    class TestInterceptor implements RepositoryInterceptor {
      public intercept(
        context: ExecutionContext<any>,
        next: RepositoryInterceptorNext<any[]>,
      ): Observable<any[]> {
        return next
          .handle()
          .pipe(
            map((result: any[]) =>
              result.map((item) => ({ ...item, intercepted: 1 })),
            ),
          );
      }
    }
    await knex(testTableName).insert({ foo: faker.random.word() });
    const result = await testRepository.list({
      intercept: [new TestInterceptor() as any],
    });
    expect(result).toMatchObject([{ intercepted: 1 }]);
  });

  test('interceptor should have access to class and handler refs', async () => {
    class TestInterceptor implements RepositoryInterceptor {
      public intercept(
        context: ExecutionContext<any>,
        next: RepositoryInterceptorNext,
      ): Observable<unknown> {
        expect(context.getClass()).toBe(TestRepository);
        expect(context.getHandler()).toBe(testRepository.list);
        return next.handle();
      }
    }
    await testRepository.list({
      intercept: [new TestInterceptor() as any],
    });
  });

  describe('reflect interceptors', () => {
    class TestInterceptor implements RepositoryInterceptor {
      public intercept(
        context: ExecutionContext<any>,
        next: RepositoryInterceptorNext<any[]>,
      ): Observable<any[]> {
        return next.handle().pipe(
          map((result) =>
            result.map((item) => ({
              ...item,
              foo: 'intercepted',
            })),
          ),
        );
      }
    }

    test('interceptor should be applied to repository', async () => {
      @UseRepositoryInterceptors(TestInterceptor)
      @EntityRepository({ name: testTableName })
      class RepositoryInterceptorRepository extends Repository<any> {}

      const repositoryInterceptorRepository =
        new RepositoryInterceptorRepository(
          knex,
          app.get(Reflector),
          app.get(ModuleRef),
        );
      await repositoryInterceptorRepository.onModuleInit();
      await knex(testTableName).insert({ foo: faker.random.word() });
      await expect(
        repositoryInterceptorRepository.list(),
      ).resolves.toMatchObject([{ foo: 'intercepted' }]);
    });

    test('interceptor should be applied to method', async () => {
      @EntityRepository({ name: testTableName })
      class MethodInterceptorRepository extends Repository<any> {
        @UseRepositoryInterceptors(new TestInterceptor())
        public list(): Promise<any> {
          return super.list();
        }
      }

      const methodInterceptorRepository = new MethodInterceptorRepository(
        knex,
        app.get(Reflector),
        app.get(ModuleRef),
      );
      await methodInterceptorRepository.onModuleInit();
      await knex(testTableName).insert({ foo: faker.random.word() });
      await expect(methodInterceptorRepository.list()).resolves.toMatchObject([
        { foo: 'intercepted' },
      ]);
    });

    it('should throw error if interceptor type passed to method interceptors', async () => {
      @EntityRepository({ name: testTableName })
      class BrokenMethodInterceptorRepository extends Repository<any> {
        @UseRepositoryInterceptors(TestInterceptor)
        public list(): Promise<any> {
          return super.list();
        }
      }

      const brokenMethodInterceptorRepository =
        new BrokenMethodInterceptorRepository(
          knex,
          app.get(Reflector),
          app.get(ModuleRef),
        );
      await brokenMethodInterceptorRepository.onModuleInit();
      await expect(
        brokenMethodInterceptorRepository.list(),
      ).rejects.toThrowError();
    });
  });
});
