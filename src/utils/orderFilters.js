import {getDateRange} from "./dateRange";

export const INITIAL_ORDER_FILTERS = {
  search: "",
  status: "",
  timeframe: "ALL",
  fromDate: "",
  toDate: "",
  method: "",
};

/** UI filter state -> the query params understood by /getAllOrders and /exportOrders. */
export const toOrderQuery = (filters) => {
  const {fromDate, toDate} = getDateRange(
    filters.timeframe,
    filters.fromDate,
    filters.toDate,
  );

  return {
    search: filters.search,
    status: filters.status,
    paymentMethod: filters.method,
    fromDate,
    toDate,
  };
};

export const isInvalidOrderRange = (filters) =>
  filters.timeframe === "CUSTOM" &&
  Boolean(filters.fromDate) &&
  Boolean(filters.toDate) &&
  filters.fromDate > filters.toDate;
