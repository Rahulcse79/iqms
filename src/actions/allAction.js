
import axios from 'axios';
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
      REPLIED_QUERY_REQUEST,
    REPLIED_QUERY_SUCCESS,
    REPLIED_QUERY_FAIL,
    SEARCH_QUERY_REQUEST,
    SEARCH_QUERY_SUCCESS,
    SEARCH_QUERY_FAIL,
    SEARCH_QUERY_BY_ID_REQUEST,
    SEARCH_QUERY_BY_ID_SUCCESS,
    SEARCH_QUERY_BY_ID_FAIL,
} from '../constants/appConstants';


/**
 * Configuration: host is configurable via env var REACT_APP_PROFILEVIEW_HOST
 * Example value: http://10.69.193.151
 *
 * Fallback to the on-prem IP you provided.
 */
const API_HOST = process.env.REACT_APP_PROFILEVIEW_HOST || 'http://10.69.193.151';
const BASE_PROFILEVIEW = `${API_HOST}/afcao/ipas/ivrs/profileView`;
const BASE_PERSONAL = `${API_HOST}/afcao/ipas/ivrs`;

// Search query by Query ID (doc_id)
export const searchQueryById = (docId) => async (dispatch) => {
    try {
        dispatch({ type: SEARCH_QUERY_BY_ID_REQUEST });

        const { data } = await axios.get(
            `/afcao/ipas/ivrs/searchQuery_docId/${docId}`
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
export const searchQueryBySnoAndCategory = (serviceNo, category) => async (dispatch) => {
    try {
        dispatch({ type: SEARCH_QUERY_REQUEST });

        const { data } = await axios.get(
            `/afcao/ipas/ivrs/searchQuery_SNO_CAT/${serviceNo}/${category}`
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

export const fetchRepliedQueries = (offset = 200) => async (dispatch) => {
    try {
        dispatch({ type: REPLIED_QUERY_REQUEST });

        const { data } = await axios.get(
            `/afcao/ipas/ivrs/repliedQuery?offset=${offset}`
        );

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

// Fetch personal data by ServiceNo & Category
export const fetchPersonalData = (serviceNo, category) => async (dispatch) => {
    try {
        dispatch({ type: FETCH_PERSONAL_DATA_REQUEST });


/**
 * Lightweight logger wrapper.
 * Replace these with a proper telemetry client (Sentry/Datadog/etc.) as needed.
 */
const log = {
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[actions]', ...args);
    }
  },
  info: (...args) => {
    // eslint-disable-next-line no-console
    console.info('[actions]', ...args);
  },
  error: (...args) => {
    // eslint-disable-next-line no-console
    console.error('[actions]', ...args);
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
      if (typeof err.response.data === 'string') return err.response.data;
      if (err.response.data.message) return err.response.data.message;
      // fallback to stringify small object for debugging
      return JSON.stringify(err.response.data);
    }
  } catch (e) {
    // noop - we'll fallback to other fields
  }
  return err?.message || 'Something went wrong';
};

/* ---------------------------
   Fetch personal data
   --------------------------- */
export const fetchPersonalData = (serviceNo, category) => async (dispatch) => {
  dispatch({ type: FETCH_PERSONAL_DATA_REQUEST });

  const url = `${BASE_PERSONAL}/fetch_pers_data/${encodeURIComponent(serviceNo)}/${encodeURIComponent(category)}`;
  log.debug('fetchPersonalData -> GET', url);

  try {
    const res = await axios.get(url, { timeout: 15000 });
    const item = res?.data?.items?.[0] ?? null;
    dispatch({ type: FETCH_PERSONAL_DATA_SUCCESS, payload: item });
    log.info('fetchPersonalData success', { serviceNo, category, received: !!item });
    return res.data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    log.error('fetchPersonalData failed', error);
    dispatch({ type: FETCH_PERSONAL_DATA_FAIL, payload: msg });
    // rethrow so callers (components) can await and handle
    throw new Error(msg);
  }
};

/* ---------------------------
   Auth actions (kept functionality, hardened)
   --------------------------- */

export const loginUser = (email, password) => async (dispatch) => {
  dispatch({ type: LOGIN_USER_REQUEST });
  log.debug('loginUser called', { email: String(email).slice(0, 12) + '...' });

  try {
    const config = { headers: { 'Content-Type': 'application/json' }, timeout: 15000 };
    const { data } = await axios.post('/api/v1/login', { email, password }, config);
    dispatch({ type: LOGIN_USER_SUCCESS, payload: data.user });
    log.info('loginUser success');
    return data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: LOGIN_USER_FAIL, payload: msg });
    log.error('loginUser failed', error);
    throw new Error(msg);
  }
};

export const loadUser = () => async (dispatch) => {
  dispatch({ type: LOAD_USER_REQUEST });
  log.debug('loadUser called');

  try {
    const { data } = await axios.get('/api/v1/me', { timeout: 15000 });
    dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
    log.info('loadUser success');
    return data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: LOAD_USER_FAIL, payload: msg });
    log.error('loadUser failed', error);
    throw new Error(msg);
  }
};

export const logoutUser = () => async (dispatch) => {
  log.debug('logoutUser called');
  try {
    const res = await axios.get('/api/v1/logout', { timeout: 10000 });
    dispatch({ type: LOGOUT_USER_SUCCESS });
    log.info('logoutUser success', res?.status);
    return res.data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: LOGOUT_USER_FAIL, payload: msg });
    log.error('logoutUser failed', error);
    throw new Error(msg);
  }
};

/* ---------------------------
   Rank / Trade / Posting history actions
   - Uses fully qualified host to avoid accidental routing through dev-server proxies.
   - Returns data on success and throws an Error on failure so callers can await / handle.
   --------------------------- */

export const getRankHistory = (serviceNo, category, page = 1) => async (dispatch) => {
  dispatch({ type: RANK_HISTORY_REQUEST });

  const url = `${BASE_PROFILEVIEW}/rankHist/${encodeURIComponent(serviceNo)}/${encodeURIComponent(category)}`;
  log.debug('getRankHistory -> GET', url);

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    dispatch({ type: RANK_HISTORY_SUCCESS, payload: data });
    log.info('getRankHistory success', { serviceNo, category, page, count: data?.count ?? null });
    return data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: RANK_HISTORY_FAIL, payload: msg });
    log.error('getRankHistory failed', error);
    throw new Error(msg);
  }
};

export const getTradeHistory = (serviceNo, category, page = 1) => async (dispatch) => {
  dispatch({ type: TRADE_HISTORY_REQUEST });

  const url = `${BASE_PROFILEVIEW}/tradeHist/${encodeURIComponent(serviceNo)}/${encodeURIComponent(category)}`;
  log.debug('getTradeHistory -> GET', url);

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    dispatch({ type: TRADE_HISTORY_SUCCESS, payload: data });
    log.info('getTradeHistory success', { serviceNo, category, page, count: data?.count ?? null });
    return data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: TRADE_HISTORY_FAIL, payload: msg });
    log.error('getTradeHistory failed', error);
    throw new Error(msg);
  }
};

export const getPostingHistory = (serviceNo, category, page = 1) => async (dispatch) => {
  dispatch({ type: POSTING_HISTORY_REQUEST });

  const url = `${BASE_PROFILEVIEW}/postingHist/${encodeURIComponent(serviceNo)}/${encodeURIComponent(category)}`;
  log.debug('getPostingHistory -> GET', url);

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    dispatch({ type: POSTING_HISTORY_SUCCESS, payload: data });
    log.info('getPostingHistory success', { serviceNo, category, page, count: data?.count ?? null });
    return data;
  } catch (error) {
    const msg = safeErrorMessage(error);
    dispatch({ type: POSTING_HISTORY_FAIL, payload: msg });
    log.error('getPostingHistory failed', error);
    throw new Error(msg);
  }
};

/* ---------------------------
   Clear errors (synchronous)
   --------------------------- */
export const clearErrors = () => (dispatch) => {
  // synchronous, no need to be async
  dispatch({ type: CLEAR_ERRORS });
  log.debug('clearErrors dispatched');
};
