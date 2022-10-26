export interface PageList<T> {
  /**
   * An array containing the actual response elements, paginated by any request parameters.
   */
  data: T[];
}
