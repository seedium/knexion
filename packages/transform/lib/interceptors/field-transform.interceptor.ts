import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import {
  KnexionContext,
  KnexionCallHandler,
  KnexionInterceptor,
} from '@knexion/core';
import { FieldTransformer, FieldTransformOptions } from '../interfaces';
import { FIELD_TRANSFORM_SCHEMA } from '../transform.constants';

type TransformSchemaEntries = [string, FieldTransformer][];

@Injectable()
export class FieldTransformInterceptor<TRecord, TResult>
  implements KnexionInterceptor<TRecord, TResult, any>
{
  constructor(private readonly reflector: Reflector) {}

  public intercept(
    context: KnexionContext<TRecord, TResult>,
    next: KnexionCallHandler<any>,
  ): Observable<any> {
    const { schema, transformer } = this.retrieveTransformSchema(context);
    const schemaEntries = Object.entries<FieldTransformer>(schema);

    if (!schemaEntries.length) {
      return next.handle();
    }

    return next.handle().pipe(
      map((result) => {
        if (transformer) {
          const transform = (data: any) => {
            return this.transform(data, schemaEntries);
          };
          return transformer(transform, result);
        }

        if (!result) {
          return result;
        }
        if (Array.isArray(result)) {
          return this.transformArray(result, schemaEntries);
        }
        return this.transform(result, schemaEntries);
      }),
    );
  }

  private transformArray(
    data: TResult[],
    schema: TransformSchemaEntries,
  ): TResult[] {
    return data.map((item) => this.transform(item, schema));
  }

  private transform(result: TResult, schema: TransformSchemaEntries): TResult {
    for (const [field, transform] of schema) {
      result[field as keyof TResult] = transform(
        result[field as keyof TResult],
      ) as TResult[keyof TResult];
    }
    return result;
  }

  private retrieveTransformSchema(
    context: KnexionContext<TRecord, TResult>,
  ): FieldTransformOptions {
    const handler = context.getHandler();
    if (handler) {
      const handlerSchema = this.reflector.get(FIELD_TRANSFORM_SCHEMA, handler);
      if (handlerSchema) {
        return handlerSchema;
      }
    }
    return this.reflector.get(FIELD_TRANSFORM_SCHEMA, context.getClass());
  }
}
