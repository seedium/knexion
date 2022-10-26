import { Test } from '@nestjs/testing';
import {
  EntityRepository,
  KnexionModule,
  KnexionModuleOptions,
  KnexionOptionsFactory,
  Repository,
} from '../../lib';
import { KNEX } from '../../lib/knexion.constants';
import { defer, lastValueFrom } from 'rxjs';
import { handleRetry } from '../../lib/knexion.utils';
import { Module } from '@nestjs/common';
import { generateDatabaseConnectionOptions } from 'knexion-test-utils';

describe('Module', () => {
  test('should bootstrap sync module', async () => {
    const app = await Test.createTestingModule({
      imports: [
        KnexionModule.forRoot({
          client: 'pg',
          connection: generateDatabaseConnectionOptions(),
        }),
      ],
    }).compile();
    const knex = app.get(KNEX);
    expect(knex).not.toBeUndefined();
    await app.close();
  });

  test('should bootstrap async module with use factory', async () => {
    const app = await Test.createTestingModule({
      imports: [
        KnexionModule.forRootAsync({
          useFactory: () => ({
            client: 'pg',
            connection: generateDatabaseConnectionOptions(),
          }),
        }),
      ],
    }).compile();
    const knex = app.get(KNEX);
    expect(knex).not.toBeUndefined();
    await app.close();
  });

  test('should bootstrap async module with use class', async () => {
    class Config implements KnexionOptionsFactory {
      createKnexOptions(): KnexionModuleOptions {
        return {
          client: 'pg',
          connection: generateDatabaseConnectionOptions(),
        };
      }
    }

    const app = await Test.createTestingModule({
      imports: [
        KnexionModule.forRootAsync({
          useClass: Config,
        }),
      ],
    }).compile();
    const knex = app.get(KNEX);
    expect(knex).not.toBeUndefined();
    await app.close();
  });

  test('should bootstrap async module with use existing', async () => {
    class Config implements KnexionOptionsFactory {
      createKnexOptions(): KnexionModuleOptions {
        return {
          client: 'pg',
          connection: generateDatabaseConnectionOptions(),
        };
      }
    }

    @Module({
      providers: [Config],
      exports: [Config],
    })
    class TestConfigModule {}

    const app = await Test.createTestingModule({
      imports: [
        KnexionModule.forRootAsync({
          imports: [TestConfigModule],
          useExisting: Config,
        }),
      ],
    }).compile();
    const knex = app.get(KNEX);
    expect(knex).not.toBeUndefined();
    await app.close();
  });

  test('should inject repositories', async () => {
    @EntityRepository({
      name: 'tests',
    })
    class TestRepository extends Repository<any> {}

    const app = await Test.createTestingModule({
      imports: [
        KnexionModule.forRoot({
          client: 'pg',
          connection: generateDatabaseConnectionOptions(),
        }),
        KnexionModule.forFeature([TestRepository]),
      ],
    }).compile();

    const testRepository = app.get(TestRepository);
    expect(testRepository).not.toBeUndefined();
    await app.close();
  });

  describe('retry', () => {
    const mockConnect = () =>
      jest
        .fn(async () => {
          return 'success';
        })
        .mockRejectedValueOnce(new Error());

    test('should retry setup connection', async () => {
      const connect = mockConnect();
      await expect(
        lastValueFrom(defer(connect).pipe(handleRetry())),
      ).resolves.toBe('success');
    });
    test('should apply specified number of attempts', async () => {
      const connect = mockConnect();
      await expect(
        lastValueFrom(defer(connect).pipe(handleRetry(1))),
      ).rejects.toThrowError();
    });
    test('should delay time between attempts', async () => {
      const connect = mockConnect();
      await expect(
        lastValueFrom(defer(connect).pipe(handleRetry(2, 100))),
      ).resolves.toBe('success');
    });
    test('should verbose retry log', async () => {
      const connect = mockConnect();
      await expect(
        lastValueFrom(defer(connect).pipe(handleRetry(2, 10, true))),
      ).resolves.toBe('success');
    });
    test('should use custom to retry function', async () => {
      const connect = mockConnect();
      await expect(
        lastValueFrom(
          defer(connect).pipe(handleRetry(2, 10, false, () => true)),
        ),
      ).resolves.toBe('success');
    });
  });
});
