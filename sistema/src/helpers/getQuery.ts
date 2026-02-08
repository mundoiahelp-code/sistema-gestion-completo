export const getQuery = (query: { [key: string]: string }): string => {
  let txt = '';

  Object.entries(query).forEach((qy) => {
    txt += `${qy[0]}=${qy[1]}&`;
  });

  return txt;
};
