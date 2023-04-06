import axios from 'axios';
import { undefToNull } from './utils.js';
import { STATUS } from './constants.js';

let AXIOS_JSON_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

if (process.env.NODE_ENV === 'development') {
  AXIOS_JSON_CONFIG.baseURL = 'http://localhost:3000';
}

export const fetchAPI = async function (endpoint, _id) {
  let apiCall = `/api/${endpoint}`;
  if (_id) {
    apiCall = `/api/${endpoint}/${_id}`;
  }
  const response = await axios.get(apiCall, AXIOS_JSON_CONFIG);
  const json = await response.data;
  return json.data;
};

export const fetchPUT = async (endpoint, formData) => {
  // watch out for empty values!
  const dataStr = JSON.stringify(formData, undefToNull);
  const response = await axios.put(`/api/${endpoint}/${formData._id}`, dataStr, AXIOS_JSON_CONFIG);
  const json = await response.data;
  return json;
};

export const json404 = (entity) => {
  return {
    success: false,
    status: STATUS.ERROR,
    message: `${entity} not found.`
  };
};

export const json503 = (message) => {
  return {
    success: false,
    status: STATUS.ERROR,
    message: `Service Unavailable: ${message}`
  };
};

const ax = {
  fetchAPI,
  fetchPUT,
  json404,
  json503
};

export default ax;
