import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://192.168.1.191/services/app/v2",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
  (config) => {
    const authData = Cookies.get("authData");
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        const token = parsedAuth?.data?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Could not parse auth data from cookie", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const authData = Cookies.get("authData");
        if (!authData) {
          window.location.href = "/login";
          return Promise.reject(error);
        }
        
        const parsedAuth = JSON.parse(authData);
        const refreshToken = parsedAuth?.data?.refreshToken;

        if (!refreshToken) {
            Cookies.remove("authData");
            window.location.href = "/login";
            return Promise.reject(error);
        }

        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken }
        );

        if (data.status === "OK" && data.data.token) {
            const newAuthData = { ...parsedAuth, data: { ...parsedAuth.data, token: data.data.token, refreshToken: data.data.refreshToken || refreshToken } };
            Cookies.set("authData", JSON.stringify(newAuthData));
    
            api.defaults.headers.common["Authorization"] = "Bearer " + data.data.token;
            originalRequest.headers["Authorization"] = "Bearer " + data.data.token;
    
            return api(originalRequest);
        } else {
            Cookies.remove("authData");
            window.location.href = "/login";
            return Promise.reject(error);
        }

      } catch (refreshError) {
        Cookies.remove("authData");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const loginAPI = async (encryptedUsername, encryptedPassword) => {
    const response = await api.post("/auth/login", { username: encryptedUsername, password: encryptedPassword });
    return response.data;
};

export default api;
