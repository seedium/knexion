import { PostgresError } from '../interfaces';

export const isPostgresError = (err: unknown): err is PostgresError => {
  return !!(err as { constraint: string }).constraint;
};
