const getVariables = () => {
  if (window.overrideURLS) {
    return {
      api: {
        services: BASE_URL_API,
      },
      app: {
        services: BASE_URL_APP,
      },
    };
  } else {
    if (process.env.REACT_APP_MODE === "ui-dev") {
      return {
        api: {
          services: "http://api.coraltele.com/services/api/v2/",
          telemetry: "http://api.coraltele.com/telemetry/api/v2/",
          mcx: "http://api.coraltele.com/mcx/app/v1/",
        },
        app: {
          services: "http://api.coraltele.com/services/app/v2/",
          telemetry: "http://api.coraltele.com/telemetry/app/v2/",
          mcx: "http://api.coraltele.com/mcx/app/v1/",
        },
        base: {
          services: "http://api.coraltele.com/services/",
          telemetry: "http://api.coraltele.com/telemetry/",
          mcx: "http://api.coraltele.com/mcx/",
        },
        webSocket: {
          services:
            "http://api.coraltele.com/services/app/v2/messaging/messages",
          telemetry:
            "http://api.coraltele.com/telemetry/app/v2/messaging/messages",
          mcx: "http://api.coraltele.com/mcx/app/v1/messaging/messages",
        },
        events: {
          services: "/app/v2/",
          telemetry: "/app/v2/",
        },
        sip: {
          domain: "ucdemo.coraltele.com",
          webRTCServer: "wss://ucdemo.coraltele.com:7443",
        },
        others: {
          conferencePortal: "https://192.168.250.191",
        },
      };
    } else if (process.env.REACT_APP_MODE === "ui-local") {
      return {
        api: {
          services: `http://${process.env.REACT_APP_LOCAL_IP}:8996/api/v2/`,
          telemetry: `http://${process.env.REACT_APP_LOCAL_IP}:8998/api/v2/`,
          mcx: `http://${process.env.REACT_APP_LOCAL_IP}:9404/api/v2/`,
        },
        app: {
          services: `http://${process.env.REACT_APP_LOCAL_IP}:8996/app/v2/`,
          telemetry: `http://${process.env.REACT_APP_LOCAL_IP}:8998/app/v2/`,
          mcx: `http://${process.env.REACT_APP_LOCAL_IP}:9404/api/v2/`,
        },
        base: {
          services: `http://${process.env.REACT_APP_LOCAL_IP}:8996/`,
          telemetry: `http://${process.env.REACT_APP_LOCAL_IP}:8998/`,
          mcx: `http://${process.env.REACT_APP_LOCAL_IP}:9404/`,
        },
        webSocket: {
          services: `http://${process.env.REACT_APP_LOCAL_IP}:8996/app/v2/messaging/messages`,
          telemetry: `http://${process.env.REACT_APP_LOCAL_IP}:8998/app/v2/messaging/messages`,
          mcx: `http://${process.env.REACT_APP_LOCAL_IP}/ws/ppdr/app/v2/messaging/messages`,
        },
        events: {
          services: "/app/v2/",
          telemetry: "/app/v2/",
        },
        sip: {
          domain: "gui.coraltele.com",
          webRTCServer: "wss://gui.coraltele.com:7443",
        },
        others: {
          conferencePortal: "https://192.168.250.191",
        },
      };
    } else if (process.env.REACT_APP_MODE === "ui-test") {
      return {
        api: {
          services: "http://test.coraltele.com/services/api/v2/",
          telemetry: "http://test.coraltele.com/telemetry/api/v2/",
          mcx: "http://test.coraltele.com/mcx/app/v1/",
        },
        app: {
          services: "http://test.coraltele.com/services/app/v2/",
          telemetry: "http://test.coraltele.com/telemetry/app/v2/",
          mcx: "http://test.coraltele.com/mcx/app/v1/",
        },
        base: {
          services: "http://test.coraltele.com/services/",
          telemetry: "http://test.coraltele.com/telemetry/",
          mcx: "http://test.coraltele.com/mcx/",
        },
        webSocket: {
          services:
            "http://test.coraltele.com/services/app/v2/messaging/messages",
          telemetry:
            "http://test.coraltele.com/telemetry/app/v2/messaging/messages",

          mcx: "http://ws/ppdr/app/v2/messaging/messages",
        },
        events: {
          services: "/app/v2/",
          telemetry: "/app/v2/",
        },
        sip: {
          domain: "ucdemo.coraltele.com",
          webRTCServer: "wss://ucdemo.coraltele.com:7443",
        },
        others: {
          conferencePortal: "https://192.168.250.191",
        },
      };
    } else {
      return {
        api: {
          services: window.location.origin + "/services/api/v2/",
          telemetry: window.location.origin + "/telemetry/api/v2/",
          mcx: window.location.origin + "/ppdr/api/v2/",
        },
        app: {
          services: window.location.origin + "/services/app/v2/",
          telemetry: window.location.origin + "/telemetry/app/v2/",
          mcx: window.location.origin + "/ppdr/api/v2/",
        },
        base: {
          services: window.location.origin + "/services/",
          telemetry: window.location.origin + "/telemetry/",
          mcx: window.location.origin + "/ppdr/",
        },
        webSocket: {
          services:
            window.location.origin + "/services/app/v2/messaging/messages",
          telemetry:
            window.location.origin + "/telemetry/app/v2/messaging/messages",
          mcx: window.location.origin + "/ws/ppdr/app/v2/messaging/messages",
        },
        events: {
          services: "/app/v2/",
          telemetry: "/app/v2/",
        },
        sip: {
          domain: window.sipDomain
            ? window.sipDomain
            : window.location.hostname,
          webRTCServer:
            window.location.protocol.replace("http", "ws") +
            "//" +
            (window.sipDomain ? window.sipDomain : window.location.hostname) +
            ":7443",
        },
        others: {
          conferencePortal: window.location.origin,
        },
      };
    }
  }
};

const variables = getVariables();

export default variables;
