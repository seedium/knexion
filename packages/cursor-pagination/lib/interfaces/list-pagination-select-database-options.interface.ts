import { SelectDatabaseOptions } from '@knexion/core';

export interface ListPaginationSelectDatabaseOptions<TRecord, TResult>
  extends SelectDatabaseOptions<TRecord, TResult> {
  limit?: number;
  /*
   * A cursor for use in pagination. starting_after is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include starting_after=obj_foo i
n order to fetch the next page of the list
   * */
  page_after?: string;

  /*
   * A cursor for use in pagination. ending_before is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with obj_bar, your subsequent call can include ending_before=obj_bar i
n order to fetch the previous page of the list
   * */
  page_before?: string;
}
