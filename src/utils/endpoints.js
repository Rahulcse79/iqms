import axios from "axios";
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

const requestHandler = (request) => {
  return request;
};

const responseHandler = (response) => {
  return response;
};

const errorHandler = (error) => {
  if (error.response?.status === 401) {
    const originalRequest = error.config;
    if (!originalRequest._retry) {
      originalRequest._retry = true;
      return refreshTokenRequest().then(() => {
        return axios(originalRequest);
      });
    } else {
      

    }
  } else if (error.response?.status === 403) {

  }
  return Promise.reject(error);
};

const refreshTokenRequest = () => {
  return axios
    .post(`${variables.api.services}user/refreshToken`, null, {
      headers: {
        
      },
    })
    .then((response) => {


      return Promise.resolve();
    })
    .catch((error) => {
      window.location = "/site/log-out";
    });
};

application.interceptors.request.use(
  (request) => requestHandler(request),
  (error) => errorHandler(error)
);

application.interceptors.response.use(
  (response) => responseHandler(response),
  (error) => errorHandler(error)
);

appServices.interceptors.request.use(
  (request) => requestHandler(request),
  (error) => errorHandler(error)
);

appServices.interceptors.response.use(
  (response) => responseHandler(response),
  (error) => errorHandler(error)
);

appTelemetry.interceptors.request.use(
  (request) => requestHandler(request),
  (error) => errorHandler(error)
);

appTelemetry.interceptors.response.use(
  (response) => responseHandler(response),
  (error) => errorHandler(error)
);

telemetry.interceptors.request.use(
  (request) => requestHandler(request),
  (error) => errorHandler(error)
);

telemetry.interceptors.response.use(
  (response) => responseHandler(response),
  (error) => errorHandler(error)
);

mcx.interceptors.request.use(
  (request) => requestHandler(request),
  (error) => errorHandler(error)
);

mcx.interceptors.response.use(
  (response) => responseHandler(response),
  (error) => errorHandler(error)
);

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

export {
  application,
  telemetry,
  mcx,
  appServices,
  appTelemetry,
  generateServicesEndPoint,
  generateTelemetryEndPoint,
};
