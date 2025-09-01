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
  // Keeping these imports so nothing breaks if you add ABC calls later
  FETCH_ABC_REQUEST,
  FETCH_ABC_SUCCESS,
  FETCH_ABC_FAILURE,
} from "../constants/ProfileConstants";

// Base paths
const BASE_PROFILEVIEW = `/afcao/ipas/ivrs/profileView`;
const BASE_PERSONAL = `/afcao/ipas/ivrs`;

/** Small logger */
const log = {
  group(label) {
    if (!DEBUG_REDUX_LOGS) return;
    try {
      // eslint-disable-next-line no-console
      console.group(label);
    } catch {}
  },
  groupEnd() {
    if (!DEBUG_REDUX_LOGS) return;
    try {
      // eslint-disable-next-line no-console
      console.groupEnd();
    } catch {}
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
  } catch {}
  return err?.message || "Something went wrong";
};

/* ---------------------------
   Fetch personal data
   --------------------------- */
export const fetchPersonalData = (serviceNo, category) => async (dispatch) => {
  dispatch({ type: FETCH_PERSONAL_DATA_REQUEST });
  const url = `${BASE_PERSONAL}/fetch_pers_data/${encodeURIComponent(serviceNo)}/${encodeURIComponent(
    category
  )}`;

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
export const getRankHistory = (serviceNo, category, page = 1) => async (dispatch) => {
  dispatch({ type: RANK_HISTORY_REQUEST });
  const url = `${BASE_PROFILEVIEW}/rankHist/${encodeURIComponent(serviceNo)}/${encodeURIComponent(category)}`;

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

export const getTradeHistory = (serviceNo, category, page = 1) => async (dispatch) => {
  dispatch({ type: TRADE_HISTORY_REQUEST });
  const url = `${BASE_PROFILEVIEW}/tradeHist/${encodeURIComponent(serviceNo)}/${encodeURIComponent(category)}`;

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

export const getPostingHistory = (serviceNo, category, page = 1) => async (dispatch) => {
  dispatch({ type: POSTING_HISTORY_REQUEST });
  const url = `${BASE_PROFILEVIEW}/postingHist/${encodeURIComponent(serviceNo)}/${encodeURIComponent(category)}`;

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

// Import breadcrumb
try {
  if (DEBUG_REDUX_LOGS) {
    // eslint-disable-next-line no-console
    console.log("[actions] ProfileAction loaded");
  }
} catch {}
