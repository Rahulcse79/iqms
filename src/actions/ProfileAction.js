// actions/ProfileAction.js
import axios from "axios";
import {
  DEBUG_REDUX_LOGS,
  FETCH_PERSONAL_DATA_REQUEST,
  FETCH_PERSONAL_DATA_SUCCESS,
  FETCH_PERSONAL_DATA_FAIL,
  RANK_HISTORY_REQUEST,
  RANK_HISTORY_SUCCESS,
  RANK_HISTORY_FAIL,
  TRADE_HISTORY_REQUEST,
  TRADE_HISTORY_SUCCESS,
  TRADE_HISTORY_FAIL,
  POSTING_HISTORY_REQUEST,
  POSTING_HISTORY_SUCCESS,
  POSTING_HISTORY_FAIL,
  FETCH_ABC_REQUEST,
  FETCH_ABC_SUCCESS,
  FETCH_ABC_FAILURE,
  GCI_HISTORY_REQUEST,
  GCI_HISTORY_SUCCESS,
  GCI_HISTORY_FAIL,
  IRLA_REQUEST,
  IRLA_SUCCESS,
  IRLA_FAIL,
  IRLA_API_TOKEN,
  POR_REQUEST, POR_SUCCESS, POR_FAIL,
} from "../constants/ProfileConstants";

// Base paths
const BASE_PROFILEVIEW = `http://sampoorna.cao.local/afcao/ipas/ivrs/profileView`;
const BASE_ABCS = `http://sampoorna.cao.local/afcao/ipas/ivrs/`;
const BASE_PERSONAL = `http://sampoorna.cao.local/afcao/ipas/ivrs`;

/** Small logger */
const log = {
  group(label) {
    if (!DEBUG_REDUX_LOGS) return;
    try {
      // eslint-disable-next-line no-console
      console.group(label);
    } catch { }
  },
  groupEnd() {
    if (!DEBUG_REDUX_LOGS) return;
    try {
      // eslint-disable-next-line no-console
      console.groupEnd();
    } catch { }
  },
  info(...args) {
    if (!DEBUG_REDUX_LOGS) return;
    // eslint-disable-next-line no-console
    console.info("[actions]", ...args);
  },
  debug(...args) {
    if (!DEBUG_REDUX_LOGS) return;
    // eslint-disable-next-line no-console
    console.debug("[actions]", ...args);
  },
  error(...args) {
    // eslint-disable-next-line no-console
    console.error("[actions]", ...args);
  },
};

const safeErrorMessage = (err) => {
  try {
    if (err?.response?.data) {
      if (typeof err.response.data === "string") return err.response.data;
      if (err.response.data.message) return err.response.data.message;
      return JSON.stringify(err.response.data);
    }
  } catch { }
  return err?.message || "Something went wrong";
};

/* ---------------------------
   Fetch personal data
   --------------------------- */
export const fetchPersonalData = (serviceNo, category) => async (dispatch) => {
  dispatch({ type: FETCH_PERSONAL_DATA_REQUEST });
  const url = `${BASE_PERSONAL}/fetch_pers_data/${encodeURIComponent(
    serviceNo
  )}/${encodeURIComponent(category)}`;

  log.group("fetchPersonalData");
  log.debug("GET", url, { serviceNo, category });

  try {
    const res = await axios.get(url, { timeout: 15000 });
    const item = res?.data?.items?.[0] ?? null;

    log.info("fetchPersonalData -> response received");
    if (DEBUG_REDUX_LOGS) {
      // eslint-disable-next-line no-console
      console.log("raw response:", res?.data);
    }
    log.debug("extracted item:", item);

    dispatch({ type: FETCH_PERSONAL_DATA_SUCCESS, payload: item });
    log.info("fetchPersonalData -> DISPATCH SUCCESS");

    return res.data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    log.error("fetchPersonalData -> ERROR", msg, { error });
    dispatch({ type: FETCH_PERSONAL_DATA_FAIL, payload: msg });
    throw new Error(msg);
  } finally {
    log.groupEnd();
  }
};

/* ---------------------------
   Rank / Trade / Posting history actions
   --------------------------- */
export const getRankHistory =
  (serviceNo, category, page = 1) =>
    async (dispatch) => {
      dispatch({ type: RANK_HISTORY_REQUEST });
      const url = `${BASE_PROFILEVIEW}/rankHist/${encodeURIComponent(
        serviceNo
      )}/${encodeURIComponent(category)}`;

      log.group("getRankHistory");
      log.debug("GET", url, { serviceNo, category, page });

      try {
        const { data } = await axios.get(url, { timeout: 15000 });
        log.info("getRankHistory -> response received, count:", data?.count);
        if (Array.isArray(data?.items)) {
          // eslint-disable-next-line no-console
          console.table(data.items);
        }
        dispatch({ type: RANK_HISTORY_SUCCESS, payload: data });
        log.info("getRankHistory -> DISPATCH SUCCESS");
        return data;
      } catch (error) {
        const msg = safeErrorMessage(error);
        log.error("getRankHistory -> ERROR", msg, { error });
        dispatch({ type: RANK_HISTORY_FAIL, payload: msg });
        throw new Error(msg);
      } finally {
        log.groupEnd();
      }
    };

export const getTradeHistory =
  (serviceNo, category, page = 1) =>
    async (dispatch) => {
      dispatch({ type: TRADE_HISTORY_REQUEST });
      const url = `${BASE_PROFILEVIEW}/tradeHist/${encodeURIComponent(
        serviceNo
      )}/${encodeURIComponent(category)}`;

      log.group("getTradeHistory");
      log.debug("GET", url, { serviceNo, category, page });

      try {
        const { data } = await axios.get(url, { timeout: 15000 });
        log.info("getTradeHistory -> response received, count:", data?.count);
        if (Array.isArray(data?.items)) {
          // eslint-disable-next-line no-console
          console.table(data.items);
        }
        dispatch({ type: TRADE_HISTORY_SUCCESS, payload: data });
        log.info("getTradeHistory -> DISPATCH SUCCESS");
        return data;
      } catch (error) {
        const msg = safeErrorMessage(error);
        log.error("getTradeHistory -> ERROR", msg, { error });
        dispatch({ type: TRADE_HISTORY_FAIL, payload: msg });
        throw new Error(msg);
      } finally {
        log.groupEnd();
      }
    };

export const getPostingHistory =
  (serviceNo, category, page = 1) =>
    async (dispatch) => {
      dispatch({ type: POSTING_HISTORY_REQUEST });
      const url = `${BASE_PROFILEVIEW}/postingHist/${encodeURIComponent(
        serviceNo
      )}/${encodeURIComponent(category)}`;

      log.group("getPostingHistory");
      log.debug("GET", url, { serviceNo, category, page });

      try {
        const { data } = await axios.get(url, { timeout: 15000 });
        log.info("getPostingHistory -> response received, count:", data?.count);
        if (Array.isArray(data?.items)) {
          // eslint-disable-next-line no-console
          console.table(data.items);
        }
        dispatch({ type: POSTING_HISTORY_SUCCESS, payload: data });
        log.info("getPostingHistory -> DISPATCH SUCCESS");
        return data;
      } catch (error) {
        const msg = safeErrorMessage(error);
        log.error("getPostingHistory -> ERROR", msg, { error });
        dispatch({ type: POSTING_HISTORY_FAIL, payload: msg });
        throw new Error(msg);
      } finally {
        log.groupEnd();
      }
    };

export const fetchABCCodes = () => async (dispatch) => {
  console.log("[Action] fetchABCCodes triggered");
  dispatch({ type: FETCH_ABC_REQUEST });

  const url = `${BASE_ABCS}fetch_abc_codes`;

  try {
    const res = await axios.get(url);
    console.log("[Action] API Response:", res.data);

    dispatch({
      type: FETCH_ABC_SUCCESS,
      payload: res.data,
    });
  } catch (error) {
    console.error("[Action] Error fetching ABC codes:", error);
    dispatch({
      type: FETCH_ABC_FAILURE,
      payload: error.message || "Failed to fetch ABC codes",
    });
  }
};

/* ----------------- getGCIHistory (with caching) -----------------
   serviceNo: string/number
   category: string/number
   abc: string (selected code)
*/
export const getGCIHistory =
  (serviceNo, category, abc) => async (dispatch, getState) => {
    if (!serviceNo) {
      const msg = "Service number required to fetch GCI history";
      dispatch({ type: GCI_HISTORY_FAIL, payload: msg });
      throw new Error(msg);
    }

    const cacheKey = `${serviceNo}|${category}|${abc}`;
    // Check cache in redux first
    try {
      const cached = getState()?.profileView?.gciHistory?.cache?.[cacheKey];
      if (cached) {
        // served from cache
        dispatch({
          type: GCI_HISTORY_SUCCESS,
          payload: cached,
          meta: { cacheKey, fromCache: true },
        });
        log.info("getGCIHistory -> served from cache", cacheKey);
        return cached;
      }
    } catch (e) {
      // noop — continue to fetch
    }

    dispatch({ type: GCI_HISTORY_REQUEST, meta: { cacheKey } });
    const url = `${BASE_PROFILEVIEW}/gciHist/${encodeURIComponent(
      serviceNo
    )}/${encodeURIComponent(abc)}`;
    log.group("getGCIHistory");
    log.debug("GET", url, { serviceNo, category, abc });

    try {
      const { data } = await axios.get(url, { timeout: 15000 });
      // `data` expected in same pattern used elsewhere: { items: [...], count, limit, offset, links }
      log.info("getGCIHistory -> response received", {
        count: data?.count ?? null,
      });
      if (process.env.NODE_ENV !== "production" && Array.isArray(data?.items)) {
        console.table(data.items.slice(0, 10));
      }
      // include cacheKey inside meta so reducer can store it
      dispatch({
        type: GCI_HISTORY_SUCCESS,
        payload: data,
        meta: { cacheKey },
      });
      log.info("getGCIHistory -> DISPATCH SUCCESS", cacheKey);
      return data;
    } catch (err) {
      const msg = safeErrorMessage(err);
      dispatch({ type: GCI_HISTORY_FAIL, payload: msg, meta: { cacheKey } });
      log.error("getGCIHistory -> ERROR", msg);
      throw new Error(msg);
    } finally {
      log.groupEnd();
    }
  };

// Import breadcrumb
try {
  if (DEBUG_REDUX_LOGS) {
    // eslint-disable-next-line no-console
    console.log("[actions] ProfileAction loaded");
  }
} catch { }

const toFormData = (obj) =>
  Object.keys(obj)
    .map(
      (key) => encodeURIComponent(key) + "=" + encodeURIComponent(obj[key])
    )
    .join("&");

const toFormDataPOR = (obj) =>
  Object.keys(obj)
    .map(
      (key) => encodeURIComponent(key) + "=" + encodeURIComponent(obj[key])
    )
    .join("&");


export const fetchIrlaView = ({ selSno, selCat, selYr, selMon, month }) => async (dispatch) => {
  dispatch({ type: IRLA_REQUEST });

  try {
    const body = toFormData({ api_token: IRLA_API_TOKEN });

    const response = await axios.post(
      `http://175.25.5.7/API/controller.php?apexApiPaySlip&selSno=${selSno}&selCat=${selCat}&selYr=${selYr}&selMon=${selMon}&month=${month}&section=FULL&request=PANKH`,
      body,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        responseType: "blob",
        timeout: 20000,
      }
    );

    const pdfBlob = new Blob([response.data], { type: "application/pdf" });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    dispatch({ type: IRLA_SUCCESS, payload: { blob: pdfBlob, url: pdfUrl } });
  } catch (err) {
    dispatch({
      type: IRLA_FAIL,
      payload:
        err?.response?.data?.message || 
        err.message ||
        "Failed to fetch IRLA View",
    });
  }
};

export const fetchPorData = ({ sno, cat, porYear }) => async (dispatch) => {
  dispatch({ type: POR_REQUEST });

  try {
    const body = toFormDataPOR({ api_token: IRLA_API_TOKEN });

    const url = `http://175.25.5.7/API/controller.php?viewPor&sno=${sno}&cat=${cat}&porYear=${porYear}&requestFrom=PANKH`;

    const response = await axios.post(url, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 20000,
    });

    dispatch({ type: POR_SUCCESS, payload: response.data });
  } catch (err) {
    dispatch({
      type: POR_FAIL,
      payload:
        err?.response?.data?.message ||
        err.message ||
        "Failed to fetch POR data",
    });
  }
};
