import axios from "axios";
import {
  LOGIN_USER_REQUEST,
  LOGIN_USER_SUCCESS,
  LOGIN_USER_FAIL,
  LOAD_USER_REQUEST,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAIL,
  LOGOUT_USER_SUCCESS,
  LOGOUT_USER_FAIL,
  CLEAR_ERRORS,
  REPLIED_QUERY_REQUEST,
  REPLIED_QUERY_SUCCESS,
  REPLIED_QUERY_FAIL,
  SEARCH_QUERY_REQUEST,
  SEARCH_QUERY_SUCCESS,
  SEARCH_QUERY_FAIL,
  SEARCH_QUERY_BY_ID_REQUEST,
  SEARCH_QUERY_BY_ID_SUCCESS,
  SEARCH_QUERY_BY_ID_FAIL,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_REQUEST,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_SUCCESS,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_FAIL,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_REQUEST,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_SUCCESS,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_FAIL,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_REQUEST,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_SUCCESS,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_FAIL,
  SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_REQUEST,
  SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_SUCCESS,
  SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_FAIL,
  SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_REQUEST,
  SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_SUCCESS,
  SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_FAIL,
  SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_REQUEST,
  SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_SUCCESS,
  SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_FAIL,
} from "../constants/appConstants";

/**
 * Configuration: host is configurable via env var REACT_APP_PROFILEVIEW_HOST
 * Example value: http://10.69.193.151
 *
 * Fallback to the on-prem IP you provided.
 */

// Officer Basic Pay Reason API call
const REPLIED_STORAGE_KEY = "repliedQueries_v1";

function safeGetRepliedFromStorage() {
  try {
    const raw = localStorage.getItem(REPLIED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (e) {
    console.error("Failed to parse repliedQueries from storage:", e);
    return null;
  }
}

function safeSaveRepliedToStorage(items) {
  try {
    localStorage.setItem(REPLIED_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    // storage full or disabled — just log, app still works
    console.warn("Failed to save repliedQueries to storage:", e);
  }
}

function safeClearRepliedStorage() {
  try {
    localStorage.removeItem(REPLIED_STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear repliedQueries storage:", e);
  }
}

export const fetchOfficerBasicPayReason = (sno) => async (dispatch) => {
  try {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_REQUEST,
      meta: { serviceNumber: sno },
    });

    const { data } = await axios.get(
      `http://sampoorna.cao.local/afcao/ipas/ivrs/srJrComparison/basicPayReason/officer/${sno}`
    );

    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_SUCCESS,
      payload: data.items || [],
      meta: { serviceNumber: sno },
    });
  } catch (error) {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_FAIL,
      payload: safeErrorMessage(error),
      meta: { serviceNumber: sno },
    });
  }
};

// Officer Rank History API call
export const fetchOfficerRankHistory = (sno) => async (dispatch) => {
  try {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_REQUEST,
      meta: { serviceNumber: sno },
    });

    const { data } = await axios.get(
      `http://sampoorna.cao.local/afcao/ipas/ivrs/srJrComparison/rankHistory/officer/${sno}`
    );

    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_SUCCESS,
      payload: data.items || [],
      meta: { serviceNumber: sno },
    });
  } catch (error) {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_FAIL,
      payload: safeErrorMessage(error),
      meta: { serviceNumber: sno },
    });
  }
};

// Officer Persmast API call
export const fetchOfficerPersmast = (sno) => async (dispatch) => {
  try {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_REQUEST,
      meta: { serviceNumber: sno },
    });

    const { data } = await axios.get(
      `http://sampoorna.cao.local/afcao/ipas/ivrs/srJrComparison/persmast/officer/${sno}`
    );

    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_SUCCESS,
      payload: data.items?.[0] || {},
      meta: { serviceNumber: sno },
    });
  } catch (error) {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_FAIL,
      payload: safeErrorMessage(error),
      meta: { serviceNumber: sno },
    });
  }
};

// Airman Basic Pay Reason
export const fetchAirmanBasicPayReason = (sno) => async (dispatch) => {
  try {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_REQUEST,
      meta: { serviceNumber: sno },
    });

    const { data } = await axios.get(
      `http://sampoorna.cao.local/afcao/ipas/ivrs/srJrComparison/basicPayReason/airmen/${sno}`
    );

    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_SUCCESS,
      payload: data.items || [],
      meta: { serviceNumber: sno },
    });
  } catch (error) {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_FAIL,
      payload: safeErrorMessage(error),
      meta: { serviceNumber: sno },
    });
  }
};

// Airman Rank History
export const fetchAirmanRankHistory = (sno) => async (dispatch) => {
  try {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_REQUEST,
      meta: { serviceNumber: sno },
    });

    const { data } = await axios.get(
      `http://sampoorna.cao.local/afcao/ipas/ivrs/srJrComparison/rankHistory/airmen/${sno}`
    );

    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_SUCCESS,
      payload: data.items || [],
      meta: { serviceNumber: sno },
    });
  } catch (error) {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_FAIL,
      payload: safeErrorMessage(error),
      meta: { serviceNumber: sno },
    });
  }
};

// Airman Persmast
export const fetchAirmanPersmast = (sno) => async (dispatch) => {
  try {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_REQUEST,
      meta: { serviceNumber: sno },
    });

    const { data } = await axios.get(
      `http://sampoorna.cao.local/afcao/ipas/ivrs/srJrComparison/persmast/airmen/${sno}`
    );

    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_SUCCESS,
      payload: data.items?.[0] || {},
      meta: { serviceNumber: sno },
    });
  } catch (error) {
    dispatch({
      type: SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_FAIL,
      payload: safeErrorMessage(error),
      meta: { serviceNumber: sno },
    });
  }
};

// Search query by Query ID (doc_id)
export const searchQueryById = (docId) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_QUERY_BY_ID_REQUEST });

    const { data } = await axios.get(
      `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_docId/${docId}`
    );

    dispatch({
      type: SEARCH_QUERY_BY_ID_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: SEARCH_QUERY_BY_ID_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Search queries by Service No + Category
export const searchQueryBySnoAndCategory =
  (serviceNo, category) => async (dispatch) => {
    try {
      dispatch({ type: SEARCH_QUERY_REQUEST });

      const { data } = await axios.get(
        `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_SNO_CAT/${serviceNo}/${category}`
      );

      dispatch({
        type: SEARCH_QUERY_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: SEARCH_QUERY_FAIL,
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// First-time fetch (with loader)
export const fetchRepliedQueries =
  (offset = 200) =>
  async (dispatch) => {
    try {
      dispatch({ type: REPLIED_QUERY_REQUEST });

      const { data } = await axios.get(
        `http://sampoorna.cao.local/afcao/ipas/ivrs/repliedQuery`
      );

      const items = data.items || [];
      safeSaveRepliedToStorage(items);

      dispatch({
        type: REPLIED_QUERY_SUCCESS,
        payload: data.items || [],
      });
    } catch (error) {
      dispatch({
        type: REPLIED_QUERY_FAIL,
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// Silent refresh (no loader)
export const refreshRepliedQueries =
  (offset = 200) =>
  async (dispatch) => {
    try {
      const { data } = await axios.get(
        `http://sampoorna.cao.local/afcao/ipas/ivrs/repliedQuery?offset=${offset}`
      );

      const items = data.items || [];
      // save to localStorage immediately
      safeSaveRepliedToStorage(items);

      dispatch({
        type: REPLIED_QUERY_SUCCESS,
        payload: data.items || [],
      });
    } catch (error) {
      console.error("Silent refresh failed", error.message);
      // Don’t dispatch FAIL, keep old data
    }
  };

/**
 * Lightweight logger wrapper.
 * Replace these with a proper telemetry client (Sentry/Datadog/etc.) as needed.
 */
const log = {
  debug: (...args) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[actions]", ...args);
    }
  },
  info: (...args) => {
    // eslint-disable-next-line no-console
    console.info("[actions]", ...args);
  },
  error: (...args) => {
    // eslint-disable-next-line no-console
    console.error("[actions]", ...args);
  },
};

/**
 * Safe error message extractor for axios/network errors.
 */
const safeErrorMessage = (err) => {
  try {
    // prefer structured server message
    if (err?.response?.data) {
      // common API shape: { message: '...' } or nested
      if (typeof err.response.data === "string") return err.response.data;
      if (err.response.data.message) return err.response.data.message;
      // fallback to stringify small object for debugging
      return JSON.stringify(err.response.data);
    }
  } catch (e) {
    // noop - we'll fallback to other fields
  }
  return err?.message || "Something went wrong";
};

/* ---------------------------
   Auth actions (kept functionality, hardened)
   --------------------------- */

export const loginUser = (email, password) => async (dispatch) => {
  dispatch({ type: LOGIN_USER_REQUEST });
  log.debug("loginUser called", { email: String(email).slice(0, 12) + "..." });

  try {
    const config = {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    };
    const { data } = await axios.post(
      "/api/v1/login",
      { email, password },
      config
    );
    dispatch({ type: LOGIN_USER_SUCCESS, payload: data.user });
    log.info("loginUser success");
    return data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: LOGIN_USER_FAIL, payload: msg });
    log.error("loginUser failed", error);
    throw new Error(msg);
  }
};

export const loadUser = () => async (dispatch) => {
  dispatch({ type: LOAD_USER_REQUEST });
  log.debug("loadUser called");

  try {
    const { data } = await axios.get("/api/v1/me", { timeout: 15000 });
    dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
    log.info("loadUser success");
    return data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: LOAD_USER_FAIL, payload: msg });
    log.error("loadUser failed", error);
    throw new Error(msg);
  }
};

export const logoutUser = () => async (dispatch) => {
  log.debug("logoutUser called");
  try {
    const res = await axios.get("/api/v1/logout", { timeout: 10000 });
    dispatch({ type: LOGOUT_USER_SUCCESS });
    log.info("logoutUser success", res?.status);
    return res.data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: LOGOUT_USER_FAIL, payload: msg });
    log.error("logoutUser failed", error);
    throw new Error(msg);
  }
};

/* ---------------------------
   Clear errors (synchronous)
   --------------------------- */
export const clearErrors = () => (dispatch) => {
  // synchronous, no need to be async
  dispatch({ type: CLEAR_ERRORS });
  log.debug("clearErrors dispatched");
};
