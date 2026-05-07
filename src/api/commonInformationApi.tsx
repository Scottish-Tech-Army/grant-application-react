import { API_ENDPOINTS_CONSTANTS } from "../constants/api-endpoints";
import axiosClient from "../factories/axios.factories";

export const fetchCommonQuestions = async ({ tenantId, pageNumber = 1, pageSize = 10 }) => {
  const response = await axiosClient.get(
    API_ENDPOINTS_CONSTANTS.COMMON_FIELD + "?tenantId=" + tenantId + "&pageNumber="+ pageNumber + "&pageSize=" + pageSize
  );

  return response.data;
};

export const createCommonQuestion = async ({ question, answer, userId, tenantId }) => {
    const response = await axiosClient.post(
      API_ENDPOINTS_CONSTANTS.COMMON_FIELD,
      {
        "question": question,
        "answer": answer,
        "userId": userId,
        "tenantId": tenantId
      }
    );
  
    return response.data;
  };

  export const updateCommonInfo = async ({ questionId, question, answer, userId, tenantId }) => {
    const response = await axiosClient.put(
      API_ENDPOINTS_CONSTANTS.COMMON_FIELD + "/" + questionId,
      {
        "question": question,
        "answer": answer,
        "userId": userId,
        "tenantId": tenantId
      }
    );
  
    return response.data;
  };

  export const deleteCommonInfo = async ({ questionId, tenantId }) => {
    const response = await axiosClient.delete(
      API_ENDPOINTS_CONSTANTS.COMMON_FIELD + "/" + questionId,
      {
        "tenantId": tenantId
      }
    );
    return response.data;
  };

  export const fetchCommonQuestionVersions = async ({ questionId, tenantId }) => {
    const response = await axiosClient.get(
      API_ENDPOINTS_CONSTANTS.COMMON_FIELD + "/" + questionId + "/versions",
      {
        "tenantId": tenantId
      }
    );
  
    return response.data;
  };