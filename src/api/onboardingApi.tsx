import { API_ENDPOINTS_CONSTANTS } from "../constants/api-endpoints";
import axiosClient from "../factories/axios.factories";

export const getUsers = async ({ tenantId }) => {
    const response = await axiosClient.get(
      API_ENDPOINTS_CONSTANTS.GET_USERS + "/" + tenantId
    );
  
    return response.data;
};

export const getTenants = async () => {
    const response = await axiosClient.get(
      API_ENDPOINTS_CONSTANTS.GET_TENANTS
    );
  
    return response.data;
};