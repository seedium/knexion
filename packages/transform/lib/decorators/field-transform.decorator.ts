import { SetMetadata } from '@nestjs/common';
import { FieldTransformOptions } from 'lib/interfaces';
import { FIELD_TRANSFORM_SCHEMA } from '../transform.constants';

export const FieldTransform = <TResult>(
  schema: FieldTransformOptions<TResult>,
): ClassDecorator & MethodDecorator => {
  return SetMetadata(FIELD_TRANSFORM_SCHEMA, schema);
};
