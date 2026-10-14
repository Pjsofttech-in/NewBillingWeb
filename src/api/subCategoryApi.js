import API from "./axios";

export const fetchSubCategories = async () =>
  (await API.get("/getAllSubCategories")).data;

export const fetchSubCategoriesByProductType = async (productTypeId) =>
  (await API.get(`/getSubCategoriesByProductType/${productTypeId}`)).data;

// Product types with their sub categories (cascading dropdowns).
export const fetchProductTypesWithSubCategories = async () =>
  (await API.get("/getProductTypesWithSubCategories")).data;

export const fetchSubCategoryById = async (id) =>
  (await API.get(`/getSubCategoryById/${id}`)).data;

// Body: { subCategoryName, description?, productType: { id } }
export const updateSubCategory = async ({id, ...payload}) =>
  (await API.put(`/updateSubCategory/${id}`, payload)).data;

export const createSubCategory = async (payload) =>
  (await API.post("/createSubCategory", payload)).data;

export const deleteSubCategory = async (id) =>
  (await API.delete(`/deleteSubCategory/${id}`)).data;
