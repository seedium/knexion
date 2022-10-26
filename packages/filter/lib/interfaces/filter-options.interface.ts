export interface FilterOptions {
  useAlias?: boolean;
}

export type FilterObject<TRecord> = Partial<
  Record<keyof TRecord, string | number | null>
>;

export interface FilterObjectOptions extends FilterOptions {
  optionKey?: string;
}
