import { SetMetadata } from '@nestjs/common';
import { EntityRepositoryOptions } from '../interfaces';
import { REPOSITORY_OPTIONS } from '../knexion.constants';

export const EntityRepository = (
  options: EntityRepositoryOptions,
): ClassDecorator => SetMetadata(REPOSITORY_OPTIONS, options);
