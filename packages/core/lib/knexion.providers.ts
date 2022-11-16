import { Provider, Type } from '@nestjs/common';

export const createKnexionProviders = (
  repositories: Type[] = [],
): Provider[] => {
  return repositories.map((repository) => ({
    provide: repository,
    useClass: repository,
  }));
};
