export const convertPgArrayToJs = (value: string): string[] =>
  value
    .slice(1, -1)
    .split(',')
    .filter((val) => !!val);
