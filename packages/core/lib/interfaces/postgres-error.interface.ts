export interface PostgresError extends Error {
  code: string | undefined;
  detail: string | undefined;
  constraint: string | undefined;
  schema: string | undefined;
  column: string | undefined;
  dataType: string | undefined;
  file: string | undefined;
  hint: string | undefined;
  internalPosition: string | undefined;
  internalQuery: string | undefined;
  line: string | undefined;
  position: string | undefined;
  routine: string | undefined;
  severity: string | undefined;
  table: string | undefined;
  where: string | undefined;
}
