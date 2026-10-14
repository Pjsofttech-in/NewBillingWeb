import {getDateRange} from "./dateRange";

/**
 * Shipment date range for the current filters. ONE function feeds both the on-screen list
 * and the PDF/CSV export, so the two can never disagree.
 *
 * Quick timeframes (Today / 7D / 30D / 1Y) only set a start date ("since then"),
 * Custom uses the From / To dates the user picked.
 */
export const shipmentDateRange = (filters) => {
  if (filters.timeframe === "CUSTOM") {
    return {fromDate: filters.fromDate || "", toDate: filters.toDate || ""};
  }

  const {fromDate} = getDateRange(filters.timeframe);
  return {fromDate, toDate: ""};
};

/** UI filter state -> query params for /exportShipments. */
export const toShipmentQuery = (filters) => ({
  search: filters.search,
  status: filters.status,
  ...shipmentDateRange(filters),
});
