// src/utils/axiosInstance.js
import axios from "axios";
import { sampoornaUrl } from "./iqmsConfig";

const api = axios.create();

api.interceptors.request.use((config) => {
  config.baseURL = sampoornaUrl();
  return config;
});

// Optional: intercept requests/responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      return Promise.reject({
        status: err.response.status,
        message: err.response.data?.message || "Server Error",
      });
    } else if (err.request) {
      return Promise.reject({ message: "No response from server" });
    } else {
      return Promise.reject({ message: err.message });
    }
  }
);

export default api;
