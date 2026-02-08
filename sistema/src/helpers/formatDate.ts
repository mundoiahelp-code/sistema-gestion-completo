export const formatDate = (
  date: Date | string,
  locale: string,
  options: Intl.DateTimeFormatOptions
) => {
  const dateFormat = new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateFormat);
};
