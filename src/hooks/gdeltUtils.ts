export const normalizeGdeltDate = (value: string | number | null | undefined): string => {
  if (value === undefined || value === null) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.length === 8 && /^\d{8}$/.test(stringValue)) {
    const year = stringValue.slice(0, 4);
    const month = stringValue.slice(4, 6);
    const day = stringValue.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  const timestamp = Number(stringValue);
  const date = Number.isNaN(timestamp) ? new Date(stringValue) : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0] ?? '';
};
