import axios from 'axios';
import { API_ENDPOINTS_CONSTANTS } from '../constants/api-endpoints';

const axiosClient = axios.create({
  baseURL: API_ENDPOINTS_CONSTANTS.BASE_URL,
  headers: API_ENDPOINTS_CONSTANTS.HEADERS,
});
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const res = error.response;

    if (res.status >= 500 && res.status <= 599) {
      console.log("something went wrong")
    }
    return res;
  },
);

export default axiosClient;
