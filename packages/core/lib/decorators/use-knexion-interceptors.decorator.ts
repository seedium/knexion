import { SetMetadata, Type } from '@nestjs/common';
import { KnexionInterceptor, KnexionInterceptors } from '../interfaces';
import { KNEXION_INTERCEPTORS } from '../knexion.constants';

export const UseKnexionInterceptors = (
  ...interceptors: KnexionInterceptors | Type<KnexionInterceptor>[]
): ClassDecorator & MethodDecorator => {
  return SetMetadata(KNEXION_INTERCEPTORS, interceptors);
};
