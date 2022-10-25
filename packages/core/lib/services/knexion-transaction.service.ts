import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectKnex } from '../decorators';
import { KnexionTransactionConfig } from '../interfaces';

@Injectable()
export class KnexionTransactionService {
  constructor(@InjectKnex() private readonly knex: Knex) {}
  public async transaction(
    config?: KnexionTransactionConfig,
  ): Promise<Knex.Transaction> {
    const transaction = await this.knex.transaction(config);
    if (config?.deferred && config.deferred.length) {
      await transaction.raw(
        `set constraints ${config.deferred.join(',')} deferred;`,
      );
    }
    return transaction;
  }
}
