export const getSortDirection = (
  property: string,
): ['asc' | 'desc', string] => {
  const sortSymbol = property[0];
  if (sortSymbol === '+') {
    return ['asc', property.slice(1, property.length)];
  } else if (sortSymbol === '-') {
    return ['desc', property.slice(1, property.length)];
  } else {
    return ['asc', property];
  }
};
