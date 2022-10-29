export interface PageList<T> {
  /**
   * An array containing the actual response elements, paginated by any request parameters.
   */
  data: T[];

  has_more_next: boolean;

  has_more_previous: boolean;
}
