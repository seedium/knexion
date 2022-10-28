import { Type } from '@nestjs/common/interfaces';
import {
  KnexArgumentsHost,
  KnexionContextType,
  KnexionExecutionContext,
  KnexionMethodType,
} from '../interfaces';
import { DefaultRepositoryOptions } from '../repository';

export class KnexionExecutionContextHost<
  TRecord,
  TResult,
  IdType = DefaultRepositoryOptions['idType'],
> implements KnexionExecutionContext<TRecord, TResult, IdType>
{
  private contextType = 'knex';
  private methodType = null;

  constructor(
    private readonly args: any[],
    private readonly constructorRef: Type = null,
    private readonly handler: Function = null,
  ) {}

  setType<TContext extends string = KnexionContextType>(type: TContext): void {
    type && (this.contextType = type);
  }

  getType<TContext extends string = KnexionContextType>(): TContext {
    return this.contextType as TContext;
  }

  setMethod<TMethod extends string = KnexionMethodType>(type: TMethod): void {
    type && (this.methodType = type);
  }

  getMethod<TMethod extends string = KnexionMethodType>(): TMethod {
    return this.methodType as TMethod;
  }

  getClass<T = any>(): Type<T> {
    return this.constructorRef;
  }

  getHandler(): Function {
    return this.handler;
  }

  getArgs<T extends Array<any> = any[]>(): T {
    return this.args as T;
  }

  getArgByIndex<T = any>(index: number): T {
    return this.args[index] as T;
  }

  switchToKnex(): KnexArgumentsHost<TRecord, TResult, IdType> {
    return Object.assign(this, {
      getQueryBuilder: () => this.getArgByIndex(0),
      getRawBuilder: () => this.getArgByIndex(1),
      createQueryBuilder: () => this.getArgByIndex(2)(),
      getOptions: () => this.getArgByIndex(3),
      switchToList: () =>
        Object.assign(this, {
          getQueryBuilder: () => this.getArgByIndex(0),
          getOptions: () => this.getArgByIndex(3),
        }),
      switchToCreate: () =>
        Object.assign(this, {
          getQueryBuilder: () => this.getArgByIndex(0),
          getOptions: () => this.getArgByIndex(3),
          getPayload: () => this.getArgByIndex(4),
        }),
      switchToRetrieve: () =>
        Object.assign(this, {
          getQueryBuilder: () => this.getArgByIndex(0),
          getOptions: () => this.getArgByIndex(3),
          getId: () => this.getArgByIndex(4),
        }),
      switchToUpdate: () =>
        Object.assign(this, {
          getQueryBuilder: () => this.getArgByIndex(0),
          getOptions: () => this.getArgByIndex(3),
          getId: () => this.getArgByIndex(4),
          getPayload: () => this.getArgByIndex(5),
        }),
      switchToDelete: () =>
        Object.assign(this, {
          getQueryBuilder: () => this.getArgByIndex(0),
          getOptions: () => this.getArgByIndex(3),
          getId: () => this.getArgByIndex(4),
        }),
    });
  }
}
