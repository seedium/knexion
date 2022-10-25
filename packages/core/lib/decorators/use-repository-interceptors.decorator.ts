import { SetMetadata, Type } from '@nestjs/common';
import { RepositoryInterceptor, RepositoryInterceptors } from '../interfaces';
import { REPOSITORY_INTERCEPTORS } from '../knexion.constants';

export const UseRepositoryInterceptors = (
  ...interceptors: RepositoryInterceptors | Type<RepositoryInterceptor>[]
): ClassDecorator & MethodDecorator => {
  return SetMetadata(REPOSITORY_INTERCEPTORS, interceptors);
};
