import { Inject } from '@nestjs/common';
import { KNEX } from '../knexion.constants';

export const InjectKnex = (): PropertyDecorator | ParameterDecorator =>
  Inject(KNEX);
