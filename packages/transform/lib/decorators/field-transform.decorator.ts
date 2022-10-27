import { SetMetadata } from '@nestjs/common';
import { FieldTransformOptions } from '../interfaces';
import { FIELD_TRANSFORM_SCHEMA } from '../transform.constants';

export const FieldTransform = (
  schema: FieldTransformOptions,
): ClassDecorator & MethodDecorator => {
  return SetMetadata(FIELD_TRANSFORM_SCHEMA, schema);
};
