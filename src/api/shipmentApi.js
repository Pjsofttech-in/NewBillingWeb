import API from "./axios";
import {pickParams} from "../utils/queryParams";
import {downloadFile} from "../utils/downloadFile";

// Filters understood by the backend (/getAllShipments and /exportShipments).
const SHIPMENT_FILTER_KEYS = ["search", "status", "fromDate", "toDate"];

export const fetchShipments = async (filters = {}) => {
  const {data} = await API.get("/getAllShipments", {
    params: pickParams(filters, SHIPMENT_FILTER_KEYS),
  });
  return data;
};

export const createShipment = async (shipmentData) => {
  const {data} = await API.post("/createShipment", shipmentData);
  return data;
};

export const deleteShipment = async (id) => {
  const {data} = await API.delete(`/deleteShipment/${id}`);
  return data;
};

// Grand total of shipment cost (cancelled shipments excluded).
export const fetchShipmentsSummary = async () => {
  const {data} = await API.get("/getShipmentsSummary");
  return data;
};

// Downloads the shipments matching `filters` as "pdf" or "csv".
export const exportShipments = (format, filters = {}) =>
  downloadFile(
    "/exportShipments",
    {...pickParams(filters, SHIPMENT_FILTER_KEYS), format},
    `shipments.${format}`,
  );

// Opens the shipment receipt PDF (inline) in a new tab.
export const openShipmentReceipt = async (shipmentId) => {
  const {data} = await API.get(`/api/v1/shipments/${shipmentId}/receipt`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// Downloads the shipment receipt PDF.
export const downloadShipmentReceipt = async (shipmentId) =>
  downloadFile(
    `/api/v1/shipments/${shipmentId}/receipt`,
    {download: true},
    `shipment_receipt_${shipmentId}.pdf`,
  );

export const fetchShipmentById = async (id) => {
  const {data} = await API.get(`/getShipmentById/${id}`);
  return data;
};
