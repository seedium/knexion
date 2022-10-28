import { Type } from '@nestjs/common';
import { KnexionArgumentsHost } from './knexion-arguments-host.interface';
import { DefaultRepositoryOptions } from '../repository';

export interface KnexionExecutionContext<
  TRecord,
  TResult = unknown,
  IdType = DefaultRepositoryOptions['idType'],
> extends KnexionArgumentsHost<TRecord, TResult, IdType> {
  /**
   * Returns the *type* of the controller class which the current handler belongs to.
   */
  getClass<T = any>(): Type<T>;
  /**
   * Returns a reference to the handler (method) that will be invoked next in the
   * request pipeline.
   */
  getHandler(): Function;
}
