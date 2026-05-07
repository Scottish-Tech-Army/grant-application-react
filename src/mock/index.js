
const API_ENDPOINTS_CONSTANTS = {
    BASE_URL: 'http://localhost:3000',
    GET_DASHBOARD: '/pixel-commanders/grant-application/v1/dashboard',
    COMMON_FIELD: '/pixel-commanders/grant-application/v1/question',
    GET_ALL_APPLICATION:"/pixel-commanders/grant-application/v1/fetchApplications",
    GET_GRAND_APPLICATION: '/pixel-commanders/grant-application/v1',
    CREATE_UPDATE_GRAND_APPLICATION: '/pixel-commanders/grant-application/v1/createOrUpdate',
    DELETE_GRAND_APPLICATION: '/pixel-commanders/grant-application/v1/delete',
    GET_USERS: '/pixel-commanders/grant-application/v1/users',
    GET_TENANTS: '/pixel-commanders/grant-application/v1/tenants',
    HEADER: {
      'x-txn-correlation-id': '2',
      'x-content-type-options': 'nosniff',
      'access-control-allow-origin': '*',
      'x-api-version': '2.0.0 ',
      'content-language': 'en-US',
      'content-length': 0,
      'x-access-uuid': '123e4567-e89b-12d3-a456-426655440000'
    }
  };
  const mock = require('./mock.json');
  const proxy = {
    [`GET /`]: (req, res) => {
      console.log('---->', req.params);
      return res.send('Mocking with mocker-api!');
    },
    [`POST ${API_ENDPOINTS_CONSTANTS.GET_DASHBOARD}`]: (req, res) => {
      return res.json(mock.getDashboard)
    },

    [`GET ${API_ENDPOINTS_CONSTANTS.COMMON_FIELD}`]: (req, res) => {
      req.params = {
        tenantId: "0eadf87c-fe41-4a62-bb79-3eebdd37be70",
        pageSize: "10",
        pageNumber: "1"
      }
      return res.json(mock.getallCommonFields)
    },

    [`POST ${API_ENDPOINTS_CONSTANTS.COMMON_FIELD}`]: (req, res) => {
      req.body = {
        question:"question", 
        answer:"answer1", 
        userId:"eddf206f-2645-4b11-9ce3-c66c2de84d82", 
        tenantId: "0eadf87c-fe41-4a62-bb79-3eebdd37be70"
      }
      return res.json(mock.createCommonFields);
    },

    [`PUT ${API_ENDPOINTS_CONSTANTS.COMMON_FIELD}/8a95e5e2-1b46-4c8c-aac1-fd60768be2c6`]: (req, res) => {
      req.body = {
        question:"question", 
        answer:"answer1", 
        userId:"eddf206f-2645-4b11-9ce3-c66c2de84d82", 
        tenantId: "0eadf87c-fe41-4a62-bb79-3eebdd37be70"
      }
      return res.json(mock.editCommonFields);
    },

    
    [`DELETE ${API_ENDPOINTS_CONSTANTS.COMMON_FIELD}/8a95e5e2-1b46-4c8c-aac1-fd60768be2c6`]: (req, res) => {
      req.params = {
        tenantId: "0eadf87c-fe41-4a62-bb79-3eebdd37be70"
      }
      return res.json(mock.deleteCommonFields);
    },

    [`GET ${API_ENDPOINTS_CONSTANTS.COMMON_FIELD}/01a1b2c3-d001-4a1b-9c01-111111111001/versions`]: (req, res) => {
      req.params = {
        tenantId: "0eadf87c-fe41-4a62-bb79-3eebdd37be70"
      }
      return res.json(mock.getAllVersions);
    },

    [`POST ${API_ENDPOINTS_CONSTANTS.CREATE_UPDATE_GRAND_APPLICATION}`]: (req, res) => {
      req.body = {
        "applicationId": "null",
        "userId": "user123",
        "tenantId": "987e6543-e21b-12d3-a456-426614174999",
        "applicationName": "Grant Application 2024",
        "funderName": "Funder Org",
        "status": "SUBMITTED",
        "applicationQADetails": [
          {
            "questionId": "111e2222-e33b-44d3-a456-426614170000",
            "question": "What is your project about?",
            "answer": "It is about AI research.",
            "section": "Common",
            "checked": true
          },
          {
            "questionId": "222e3333-e44b-55d3-a456-426614171111",
            "question": "Requested funding amount?",
            "answer": "50000",
            "section": "Additional"
          }
        ]
      };
      return res.json(mock.submitGrandAppResponse);
    },
    [`POST ${API_ENDPOINTS_CONSTANTS.GET_ALL_APPLICATION}`]: (req, res) => {
      req.body = {
        tenantId: "0eadf87c-fe41-4a62-bb79-3eebdd37be70",
        userId: "42391438-f47c-47f1-a4b7-c1078a8a7ccf",
        pageNumber: "1",
        pageSize: "10"
      }
      return res.json(mock.getAllApplications);
    },
}

module.exports = proxy;
