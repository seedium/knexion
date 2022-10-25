import { faker } from '@faker-js/faker';
import { addPrefixColumn, isPostgresError } from '../lib';
import { isFunction } from '../lib/utils/internal';

describe('Utils', () => {
  describe('addPrefixColumn', () => {
    test('should return simple column if alias is not provided', () => {
      const fakeColumn = faker.database.column();
      expect(addPrefixColumn(fakeColumn)).toEqual(fakeColumn);
    });
    test('should return column with prefixed alias', () => {
      const fakeColumn = faker.database.column();
      const fakeAlias = faker.random.word();
      expect(addPrefixColumn(fakeColumn, fakeAlias)).toEqual(
        fakeAlias + '.' + fakeColumn,
      );
    });
  });

  describe('isPostgresError', () => {
    test('should return true if postgres error', async () => {
      expect(
        isPostgresError({
          ...new Error(),
          constraint: faker.random.word(),
        }),
      ).toBe(true);
    });

    test('should return false if error is not postgres', () => {
      expect(isPostgresError(new Error())).toBe(false);
    });
  });

  describe('Internal', () => {
    describe('isFunction', () => {
      test('should return true if class', () => {
        class Test {}
        expect(isFunction(Test)).toBe(true);
      });
      test('should return false if instance of class', () => {
        class Test {}
        const test = new Test();
        expect(isFunction(test)).toBe(false);
      });
    });
  });
});
