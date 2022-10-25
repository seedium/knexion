export type TakeField<
  T extends object,
  Field extends keyof T,
> = T[Field] extends string ? T[Field] : '';
