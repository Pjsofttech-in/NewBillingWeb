import API from "./axios";

export const fetchShippedBy = async () => {
  const {data} = await API.get("/getAllShippedBy");
  return data;
};

export const createShippedBy = async (shippedByData) => {
  const {data} = await API.post("/createShippedBy", shippedByData);
  return data;
};

export const deleteShippedBy = async (id) => {
  const {data} = await API.delete(`/deleteShippedBy/${id}`);
  return data;
};
