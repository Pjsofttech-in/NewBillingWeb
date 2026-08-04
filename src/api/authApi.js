import API from "./axios";

export const loginUserApi = async ({credentials}) => {
  const endpoint = "/auth/login";

  
  const response = await API.post(endpoint, {
    username: credentials.username || credentials.email,
    password: credentials.password,
  });

  // Spring Boot directly returns the JWT token string or "Invalid Credentials"
  const data = response.data;

  if (typeof data === "string" && data === "Invalid Credentials") {
    throw new Error("Invalid Credentials");
  }

  // Return formatted object containing the token
  return typeof data === "string" ? {token: data} : data;
};

export const fetchStaffPermissions = async (email) => {
  const response = await API.get(`/permissionForStaff?staffEmail=${email}`);
  return response.data;
};
