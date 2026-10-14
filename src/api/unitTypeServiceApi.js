import API from "./axios";

export const fetchUnitTypes = async () => {
  const {data} = await API.get("/getAllUnitTypes");
  return data;
};

export const createUnitType = async (unitData) => {
  const {data} = await API.post("/createUnitType", unitData);
  return data;
};

export const deleteUnitType = async (id) => {
  const {data} = await API.delete(`/deleteUnitType/${id}`);
  return data;
};
