import { faker } from '@faker-js/faker';
import { EntityRepository, KnexionModule, Repository } from '@knexion/core';
import { Knex } from 'knex';
import { DynamicModule } from '@nestjs/common';

export interface TestRecord {
  id: number;
  foo: string | null;
}

export class TestRepository extends Repository<
  TestRecord,
  { idType: TestRecord['id']; omitCreateFields: 'id'; omitUpdateFields: 'id' }
> {}

export const buildTestRepository = (): {
  name: string;
  init: (knex: Knex) => void;
  forFeature: () => DynamicModule;
  createTable: () => Promise<void>;
  dropTable: () => Promise<void>;
  truncate: () => Promise<void>;
} => {
  let knex: Knex;
  const name = faker.word.noun().toLowerCase();

  EntityRepository({ name })(TestRepository);

  return {
    name,
    init: (_knex: Knex) => (knex = _knex),
    forFeature: () => KnexionModule.forFeature([TestRepository]),
    createTable: () =>
      knex.schema.createTable(name, (table) => {
        table.increments('id').primary();
        table.string('foo');
      }),
    dropTable: () => knex.schema.dropTable(name),
    truncate: () => knex(name).truncate(),
  };
};
