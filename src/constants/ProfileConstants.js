// constants/ProfileConstants.js

// Toggle this to silence logs in prod builds if you want
export const DEBUG_REDUX_LOGS = true;

export const FETCH_PERSONAL_DATA_REQUEST = "FETCH_PERSONAL_DATA_REQUEST";
export const FETCH_PERSONAL_DATA_SUCCESS = "FETCH_PERSONAL_DATA_SUCCESS";
export const FETCH_PERSONAL_DATA_FAIL = "FETCH_PERSONAL_DATA_FAIL";

export const RANK_HISTORY_REQUEST = "RANK_HISTORY_REQUEST";
export const RANK_HISTORY_SUCCESS = "RANK_HISTORY_SUCCESS";
export const RANK_HISTORY_FAIL = "RANK_HISTORY_FAIL";

export const TRADE_HISTORY_REQUEST = "TRADE_HISTORY_REQUEST";
export const TRADE_HISTORY_SUCCESS = "TRADE_HISTORY_SUCCESS";
export const TRADE_HISTORY_FAIL = "TRADE_HISTORY_FAIL";

export const POSTING_HISTORY_REQUEST = "POSTING_HISTORY_REQUEST";
export const POSTING_HISTORY_SUCCESS = "POSTING_HISTORY_SUCCESS";
export const POSTING_HISTORY_FAIL = "POSTING_HISTORY_FAIL";

export const FETCH_ABC_REQUEST = "FETCH_ABC_REQUEST";
export const FETCH_ABC_SUCCESS = "FETCH_ABC_SUCCESS";
export const FETCH_ABC_FAILURE = "FETCH_ABC_FAILURE";

export const GCI_HISTORY_REQUEST = "GCI_HISTORY_REQUEST";
export const GCI_HISTORY_SUCCESS = "GCI_HISTORY_SUCCESS";
export const GCI_HISTORY_FAIL = "GCI_HISTORY_FAIL";



// Light import-time breadcrumb so you know constants loaded
try {
  if (DEBUG_REDUX_LOGS) {
    // eslint-disable-next-line no-console
    console.log("[constants] ProfileConstants loaded");
  }
} catch {}
