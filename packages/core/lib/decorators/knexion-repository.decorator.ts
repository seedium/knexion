import { SetMetadata } from '@nestjs/common';
import { KnexionRepositoryOptions } from '../interfaces';
import { KNEXION_REPOSITORY_OPTIONS } from '../knexion.constants';

export const KnexionRepository = (
  options: KnexionRepositoryOptions,
): ClassDecorator => SetMetadata(KNEXION_REPOSITORY_OPTIONS, options);
