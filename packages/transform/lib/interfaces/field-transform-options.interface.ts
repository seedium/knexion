export type FieldTransformer<TValue = any, TResult = unknown> = (
  value: TValue,
) => TResult;

export type FieldTransformSchema = Record<string, FieldTransformer>;

export type ItemTransformer = (data: any) => any;

export interface FieldTransformOptions {
  schema: FieldTransformSchema;
  transformer?: (transform: ItemTransformer, result: any) => any;
}
