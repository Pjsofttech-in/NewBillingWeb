const pad = (n) => String(n).padStart(2, "0");

/** Local date as YYYY-MM-DD (what the backend and <input type="date"> use). */
export const toDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getTodayString = () => toDateString(new Date());

/**
 * Turns a timeframe dropdown value (ALL / TODAY / 7D / 30D / 1Y / CUSTOM)
 * into a {fromDate, toDate} pair of YYYY-MM-DD strings ("" = no limit).
 */
export const getDateRange = (timeframe, customFromDate, customToDate) => {
  const today = new Date();

  if (timeframe === "TODAY") {
    const todayString = toDateString(today);
    return {fromDate: todayString, toDate: todayString};
  }

  if (timeframe === "7D") {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return {fromDate: toDateString(from), toDate: toDateString(today)};
  }

  if (timeframe === "30D") {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    return {fromDate: toDateString(from), toDate: toDateString(today)};
  }

  if (timeframe === "1Y") {
    const from = new Date(today);
    from.setFullYear(today.getFullYear() - 1);
    return {fromDate: toDateString(from), toDate: toDateString(today)};
  }

  if (timeframe === "CUSTOM") {
    return {fromDate: customFromDate || "", toDate: customToDate || ""};
  }

  return {fromDate: "", toDate: ""};
};
