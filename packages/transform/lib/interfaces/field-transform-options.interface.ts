export type FieldTransformer<TValue = any, TResult = unknown> = (
  value: TValue,
) => TResult;

export type FieldTransformSchema = Record<string, FieldTransformer>;

export interface FieldTransformOptions<TResult> {
  schema: FieldTransformSchema;
  resolver?: (
    data: TResult | TResult[] | null | unknown,
  ) => TResult | TResult[] | null;
}
