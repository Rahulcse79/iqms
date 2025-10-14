import axios from "axios";
import Cookies from "js-cookie";
import variables from "./variables";

const application = axios.create({
  baseURL: variables.api.services,
});

const telemetry = axios.create({
  baseURL: variables.api.telemetry,
});

const appServices = axios.create({
  baseURL: variables.app.services,
});

const appTelemetry = axios.create({
  baseURL: variables.app.telemetry,
});

const mcx = axios.create({
  baseURL: variables.api.mcx,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const requestHandler = (request) => {
  const authData = Cookies.get("authData");
  if (authData) {
    try {
      const parsedAuth = JSON.parse(authData);
      const token = parsedAuth?.token;
      if (token) {
        request.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Could not parse auth data from cookie", e);
      processQueue(e, null);
      Cookies.remove("authData", { path: "/" });
      localStorage.clear();
      window.location = "/app2/login";
      return Promise.reject(e);
    }
  }
  return request;
};

const responseHandler = (response) => {
  return response;
};

const errorHandler = async (error) => {
  const originalRequest = error.config;

  if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return axios(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newAuthData = await refreshTokenRequest();
      const newToken = newAuthData.token;
      axios.defaults.headers.common["Authorization"] = "Bearer " + newToken;
      originalRequest.headers["Authorization"] = "Bearer " + newToken;
      processQueue(null, newToken);
      return axios(originalRequest);
    } catch (err) {
      processQueue(err, null);
      Cookies.remove("authData", { path: "/" });
      localStorage.clear();
      window.location = "/app2/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
};

const refreshTokenRequest = () => {
  return new Promise((resolve, reject) => {
    const authData = Cookies.get("authData");
    let refreshToken = null;
    if (authData) {
      try {
        refreshToken = JSON.parse(authData).refreshToken;
      } catch (e) {
        return reject(new Error("Failed to parse auth data."));
      }
    }

    if (!refreshToken) {
      return reject(new Error("No refresh token available."));
    }

    axios
      .post(`${variables.app.services}auth/refreshToken`, { refreshToken })
      .then((response) => {
        if (response.data.status === "OK" && response.data.data.token) {
          const currentAuthData = JSON.parse(Cookies.get("authData") || "{}");
          const newAuthData = {
            ...currentAuthData,
            token: response.data.data.token,
            refreshToken:
              response.data.data.refreshToken || currentAuthData.refreshToken,
          };

          const eightHoursFromNow = new Date(
            new Date().getTime() + 8 * 60 * 60 * 1000
          );
          Cookies.set("authData", JSON.stringify(newAuthData), {
            expires: eightHoursFromNow,
            path: "/",
            secure: window.location.protocol === "https:",
            sameSite: "Lax",
          });
          resolve(newAuthData);
        } else {
          reject(new Error("Refresh token request failed."));
        }
      })
      .catch((error) => {
        console.error("Error during token refresh:", error);
        reject(error);
      });
  });
};

const instances = [application, telemetry, mcx, appServices, appTelemetry];
instances.forEach((instance) => {
  instance.interceptors.request.use(requestHandler, (error) =>
    Promise.reject(error)
  );
  instance.interceptors.response.use(responseHandler, errorHandler);
});

const generateServicesEndPoint = (urlScheme, ipAddress) => {
  let baseURL = `${urlScheme}//${ipAddress}/services/api/v2/`;
  const endPoint = axios.create({
    baseURL: baseURL,
  });

  endPoint.interceptors.request.use(
    (request) => requestHandler(request),
    (error) => errorHandler(error)
  );

  endPoint.interceptors.response.use(
    (response) => responseHandler(response),
    (error) => errorHandler(error)
  );

  return endPoint;
};

const generateTelemetryEndPoint = (urlScheme, ipAddress) => {
  const endPoint = axios.create({
    baseURL: `${urlScheme}//${ipAddress}/telemetry/api/v2/`,
  });

  endPoint.interceptors.request.use(
    (request) => requestHandler(request),
    (error) => errorHandler(error)
  );

  endPoint.interceptors.response.use(
    (response) => responseHandler(response),
    (error) => errorHandler(error)
  );

  return endPoint;
};

export const loginAPI = (encryptedUsername, encryptedPassword) => {
  return appServices.post(variables.app.services + "auth/login", {
    username: encryptedUsername,
    password: encryptedPassword,
  });
};

export {
  application,
  telemetry,
  mcx,
  appServices,
  appTelemetry,
  generateServicesEndPoint,
  generateTelemetryEndPoint,
};
