import { SelectDatabaseOptions } from '@knexion/core';

export interface ListPaginationSelectDatabaseOptions<TRecord, TResult>
  extends SelectDatabaseOptions<TRecord, TResult> {
  limit?: number;
  page?: number;
}
