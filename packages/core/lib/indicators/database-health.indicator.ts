import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Knex } from 'knex';
import { InjectKnex } from '../decorators';

export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(@InjectKnex() private readonly knex: Knex) {
    super();
  }

  public async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      await this.knex.raw(`select 1+1 as result`);
      return this.getStatus('database', true);
    } catch (err) {
      throw new HealthCheckError(
        'Database is not healthy',
        this.getStatus('database', false),
      );
    }
  }
}
