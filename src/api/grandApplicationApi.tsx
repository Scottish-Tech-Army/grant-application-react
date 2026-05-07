import { API_ENDPOINTS_CONSTANTS } from "../constants/api-endpoints";
import axiosClient from "../factories/axios.factories";

export const fetchApplications = async ({
  userId,
  tenantId,
  pageNumber = 0, // backend is 0-based
  pageSize = 10,
}) => {
  const response = await axiosClient.post(
    API_ENDPOINTS_CONSTANTS.GET_ALL_APPLICATION,
    {
      "userId": userId,
      "tenantId": tenantId,
      "pageNumber" :pageNumber,
      "pageSize":pageSize,
    }
  );

  return response.data;
};

export const getGrandApplication = async ({ applicationId }) => {
    const response = await axiosClient.get(
      API_ENDPOINTS_CONSTANTS.GET_GRAND_APPLICATION + "/" + applicationId
    );
  
    return response.data;
};

export const createOrUpdateApplication = async ({ payload }) => {
    const response = await axiosClient.post(
      API_ENDPOINTS_CONSTANTS.CREATE_UPDATE_GRAND_APPLICATION,
      payload
    );
  
    return response.data;
};

export const deleteGrandApplication = async ({ applicationId }) => {
    const response = await axiosClient.delete(
      API_ENDPOINTS_CONSTANTS.CREATE_UPDATE_GRAND_APPLICATION + "/" + applicationId
    );
  
    return response.data;
};