// src/utils/axiosInstance.js
import axios from "axios";
import { getTenantConfig } from "../tenants";

const createAxiosInstance = (tenantId) => {
  const tenantConfig = getTenantConfig(tenantId);
  const baseURL = tenantConfig ? tenantConfig.api.baseUrl : "";

  const instance = axios.create({
    baseURL,
  });

  // Add a request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createAxiosInstance;
