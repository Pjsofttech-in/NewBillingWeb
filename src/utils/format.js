// Shared number / money formatting. One place instead of a copy in every file.

const IN = "en-IN";

/** 1,234.50 - always two decimals (tables, forms, receipts). */
export const money = (value) =>
  `${Number(value || 0).toLocaleString(IN, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** 1,234.5 / 1,234 - up to two decimals, none when the amount is whole (compact lists). */
export const moneyAuto = (value) =>
  `${Number(value || 0).toLocaleString(IN, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

/** 1234.50 - plain, no thousands separator (invoice and payment lines). */
export const moneyPlain = (value) => `${Number(value || 0).toFixed(2)}`;
