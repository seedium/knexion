import { faker } from '@faker-js/faker';
import { KnexionRepository, KnexionModule, Repository } from '@knexion/core';
import { Knex } from 'knex';
import { DynamicModule } from '@nestjs/common';

export interface TestRecord {
  id: number;
  foo: string | null;
}

export class TestRepository<
  TRecord extends TestRecord = TestRecord,
> extends Repository<
  TRecord,
  { idType: TestRecord['id']; omitCreateFields: 'id'; omitUpdateFields: 'id' }
> {}

export const buildTestRepository = ({
  createTable,
}: {
  createTable?: (table: Knex.CreateTableBuilder) => void;
} = {}): {
  name: string;
  init: (knex: Knex) => void;
  forFeature: () => DynamicModule;
  createTable: () => Promise<void>;
  dropTable: () => Promise<void>;
  truncate: () => Promise<void>;
} => {
  let knex: Knex;
  const name = faker.word.noun().toLowerCase();

  KnexionRepository({ name })(TestRepository);

  return {
    name,
    init: (_knex: Knex) => (knex = _knex),
    forFeature: () => KnexionModule.forFeature([TestRepository]),
    createTable: () =>
      knex.schema.createTable(name, (table) => {
        table.increments('id').primary();
        table.string('foo');
        if (createTable) {
          createTable(table);
        }
      }),
    dropTable: () => knex.schema.dropTable(name),
    truncate: () => knex(name).truncate(),
  };
};
