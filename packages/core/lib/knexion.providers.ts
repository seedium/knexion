import { Provider, Type } from '@nestjs/common';

export const createKnexProviders = (repositories: Type[] = []): Provider[] => {
  return repositories.map((repository) => ({
    provide: repository,
    useClass: repository,
  }));
};
