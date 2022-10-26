export interface RangeNumberFilter {
  /**
   * Return records where the field is after this value.
   */
  gt?: number;

  /**
   * Return records where the field is after or equal to this value.
   */
  gte?: number;

  /**
   * Return records where the field is before this value.
   */
  lt?: number;

  /**
   * Return records where the field is before or equal to this value.
   */
  lte?: number;
}
