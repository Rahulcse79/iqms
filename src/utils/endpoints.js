import axios from "axios";
import Cookies from "js-cookie";
import variables from "./variables";

// ---------- Axios Instances ----------
const application = axios.create({ baseURL: variables.api.services });
const opaqueTelemetry = axios.create({ baseURL: variables.api.telemetry });
const opaqueServices = axios.create({ baseURL: variables.api.services });
const telemetry = axios.create({ baseURL: variables.api.telemetry });
const appServices = axios.create({ baseURL: variables.app.services });
const appTelemetry = axios.create({ baseURL: variables.app.telemetry });
const mcx = axios.create({ baseURL: variables.api.mcx });

// ---------- Token Refresh & Queue Handling ----------
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

// ---------- Request Interceptor ----------
const requestHandler = (request) => {
  const authData = Cookies.get("authData");
  if (authData) {
    try {
      const parsedAuth = JSON.parse(authData);
      const token = parsedAuth?.token;
      if (token) request.headers["Authorization"] = `Bearer ${token}`;
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

const opaqueRequestHandler = (request) => {
  try {
    const opaque = "abcdefgh";
    if (opaque) request.headers["Authorization"] = `Opaque ${opaque}`;
  } catch (e) {
    console.error("Could not process request issue with header", e);
    return Promise.reject(e);
  }
  return request;
};

// ---------- Response / Error Handler ----------
const responseHandler = (response) => response;

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
      // Cookies.remove("authData", { path: "/" });
      // localStorage.clear();
      // window.location = "/app2/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
};

// ---------- Refresh Token ----------
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
      .post(`${variables.api.services}user/refreshToken`, {}, {
        headers: {
          "Authorization": `Refresh-Bearer ${refreshToken}`
        }
      })
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

const opaqueInstances = [opaqueTelemetry, opaqueServices];
opaqueInstances.forEach((instance) => {
  instance.interceptors.request.use(opaqueRequestHandler, (error) =>
    Promise.reject(error)
  );
  instance.interceptors.response.use(responseHandler, errorHandler);
});

// ---------- Generate Dynamic Endpoints ----------
const generateServicesEndPoint = (urlScheme, ipAddress) => {
  const endPoint = axios.create({
    baseURL: `${urlScheme}//${ipAddress}/services/api/v2/`,
  });
  endPoint.interceptors.request.use(requestHandler, errorHandler);
  endPoint.interceptors.response.use(responseHandler, errorHandler);
  return endPoint;
};

const generateTelemetryEndPoint = (urlScheme, ipAddress) => {
  const endPoint = axios.create({
    baseURL: `${urlScheme}//${ipAddress}/telemetry/api/v2/`,
  });
  endPoint.interceptors.request.use(requestHandler, errorHandler);
  endPoint.interceptors.response.use(responseHandler, errorHandler);
  return endPoint;
};

// ---------- Auth API ----------
export const loginAPI = (encryptedUsername, encryptedPassword) => {
  return appServices.post(variables.app.services + "auth/login", {
    username: encryptedUsername,
    password: encryptedPassword,
  });
};

// ---------- Exports ----------
export const logoutAPI = async () => {
  console.log("Logging out agent via API");
  try {
    const resp = await application.post("agentStatus/create", {
      status: "Logout",
    });

    if (resp.status === 200 || resp.status === 400) {
      console.log("Agent logout acknowledged:", resp.status);
      localStorage.clear();
      Cookies.remove("authData", { path: "/" });
    } else {
      console.error("Error updating agent status on logout:", resp);
    }

    return resp;
  } catch (error) {
    // Treat HTTP 400 as success for logout in this specific case
    if (error?.response?.status === 400) {
      console.log("Agent logout acknowledged (handled 400):", error.response.status);
      localStorage.clear();
      Cookies.remove("authData", { path: "/" });
      return error.response;
    }

    console.error("Failed to update agent status on logout:", error);
    // swallow the error to avoid uncaught exceptions; caller can check the return value
    return null;
  }
};

export const getAgentStatus = () => {
  try {
    const authData = JSON.parse(Cookies.get("authData"));
    const username = authData?.user?.username;

    if (!username) {
      Cookies.remove("authData", { path: "/" });
      localStorage.clear();
      window.location = "/app2/login";
      throw new Error("Username not found in cookie");
    }

    console.log("Username from cookie:", username);

    application
      .post(`/agent/${username}`)
      .then((response) => {
        const data = response.data.data;
        if (data.status === "Logged In") {
          console.log("Agent is logged in.");
        } else if (data.status === "Logout") {
          logoutAPI();
        } else {
          console.log("Agent status:", data.status);
        }
      })
      .catch((error) => {
        console.error("Error fetching agent status:", error);
      });
  } catch (err) {
    console.error("Failed to get username from cookie:", err);
    window.location = "/app2/login"; // fallback redirect if cookie is broken
  }
};

export {
  application,
  telemetry,
  mcx,
  appServices,
  appTelemetry,
  opaqueServices,
  opaqueTelemetry,
  generateServicesEndPoint,
  generateTelemetryEndPoint,
};
