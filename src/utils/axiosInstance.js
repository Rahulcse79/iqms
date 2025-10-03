// src/utils/axiosInstance.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://sampoorna.cao.local/afcao/ipas/ivrs",
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
