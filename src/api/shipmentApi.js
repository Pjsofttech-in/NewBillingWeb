import API from "./axios";

export const fetchShipments = async () => {
  const {data} = await API.get("/getAllShipments");
  return data;
};

export const fetchShipmentById = async (id) => {
  const {data} = await API.get(`/getShipmentById/${id}`);
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
