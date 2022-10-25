import { Knex } from 'knex';

export interface KnexionTransactionConfig extends Knex.TransactionConfig {
  deferred?: string[];
}
