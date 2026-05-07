import { API_ENDPOINTS_CONSTANTS } from "../constants/api-endpoints";
import axiosClient from "../factories/axios.factories";

export const fetchDashboardData = async ({ tenantId, userId }) => {
  const response = await axiosClient.post(
    API_ENDPOINTS_CONSTANTS.GET_DASHBOARD,
    {
      tenantId,
      userId,
    }
  );

  return response.data;
};