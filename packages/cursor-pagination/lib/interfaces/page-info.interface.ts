export interface PageInfo<IdType extends string | number> {
  id: IdType;
  created_at: number;
  [column: string]: string | number | null;
}
