export const API_ENDPOINTS_CONSTANTS = {
    BASE_URL: 'http://localhost:3000',
    GET_DASHBOARD: '/pixel-commanders/grant-application/v1/dashboard',
    COMMON_FIELD: '/pixel-commanders/grant-application/v1/question',
    GET_ALL_APPLICATION:"/pixel-commanders/grant-application/v1/fetchApplications",
    GET_GRAND_APPLICATION: '/pixel-commanders/grant-application/v1',
    CREATE_UPDATE_GRAND_APPLICATION: '/pixel-commanders/grant-application/v1/createOrUpdate',
    DELETE_GRAND_APPLICATION: '/pixel-commanders/grant-application/v1/delete',
    GET_USERS: '/pixel-commanders/grant-application/v1/users',
    GET_TENANTS: '/pixel-commanders/grant-application/v1/tenants',
    HEADERS: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
}