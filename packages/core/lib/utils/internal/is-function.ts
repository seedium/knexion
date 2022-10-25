import { isFunction as isFunctionNest } from '@nestjs/common/utils/shared.utils';

export const isFunction = (
  maybeFunction: unknown,
): maybeFunction is Function => {
  return isFunctionNest(maybeFunction);
};
