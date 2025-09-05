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
  SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_RESET,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_REQUEST,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_SUCCESS,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_FAIL,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_RESET,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_REQUEST,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_SUCCESS,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_FAIL,
  SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_RESET,
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

import {
SEARCH_QUERY_ID_REQUEST,
SEARCH_QUERY_ID_SUCCESS,
SEARCH_QUERY_ID_FAIL,
} from "../constants/queryConstants";

export const officerBasicPayReasonReducer = (state = { basicPayReasons: [] }, action) => {
  switch (action.type) {
    case SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_REQUEST:
      return { loading: true, basicPayReasons: [] };
    case SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_SUCCESS:
      return { loading: false, basicPayReasons: action.payload };
    case SENIOR_JUNIOR_COMPARISON_OFFICER_BASIC_PAY_REASON_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const officerRankHistoryReducer = (state = { rankHistory: [] }, action) => {
  switch (action.type) {
    case SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_REQUEST:
      return { loading: true, rankHistory: [] };
    case SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_SUCCESS:
      return { loading: false, rankHistory: action.payload };
    case SENIOR_JUNIOR_COMPARISON_OFFICER_RANK_HISTORY_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const officerPersmastReducer = (state = { officer: [] }, action) => {
  switch (action.type) {
    case SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_REQUEST:
      return { loading: true, officer: [] };
    case SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_SUCCESS:
      return { loading: false, officer: action.payload };
    case SENIOR_JUNIOR_COMPARISON_OFFICER_PERSMAST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const airmanBasicPayReasonReducer = (
  state = { basicPayReasons: [] },
  action
) => {
  switch (action.type) {
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_REQUEST:
      return { loading: true, basicPayReasons: [] };
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_SUCCESS:
      return { loading: false, basicPayReasons: action.payload };
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_FAIL:
      return { loading: false, error: action.payload };
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_BASICPAY_REASON_RESET:
      return { basicPayReasons: [] };
    default:
      return state;
  }
};

export const airmanRankHistoryReducer = (
  state = { rankHistory: [] },
  action
) => {
  switch (action.type) {
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_REQUEST:
      return { loading: true, rankHistory: [] };
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_SUCCESS:
      return { loading: false, rankHistory: action.payload };
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_FAIL:
      return { loading: false, error: action.payload };
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_RANKHISTORY_RESET:
      return { rankHistory: [] };
    default:
      return state;
  }
};

export const airmanPersmastReducer = (state = { airman: {} }, action) => {
  switch (action.type) {
    case SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_REQUEST:
      return { loading: true, airman: {} };

    case SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_SUCCESS:
      return { loading: false, airman: action.payload };

    case SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_FAIL:
      return { loading: false, error: action.payload };

    case SENIOR_JUNIOR_COMPARISON_AIRMAN_PERSMAST_RESET:
      return { airman: {} };

    default:
      return state;
  }
};

export const searchQueryByIdReducer = (state = { item: null }, action) => {
  switch (action.type) {
    case SEARCH_QUERY_BY_ID_REQUEST:
      return { ...state, loading: true, error: null };

    case SEARCH_QUERY_BY_ID_SUCCESS:
      return {
        loading: false,
        item: action.payload.items[0] || null,
        count: action.payload.count,
      };

    case SEARCH_QUERY_BY_ID_FAIL:
      return { loading: false, error: action.payload, item: null };

    default:
      return state;
  }
};

export const searchQueryIdReducer = (state = { items: [] }, action) => {
  switch (action.type) {
    case SEARCH_QUERY_ID_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SEARCH_QUERY_ID_SUCCESS:
      return {
        loading: false,
        items: action.payload.items || [],
        count: action.payload.count || 0,
        hasMore: action.payload.hasMore || false,
        limit: action.payload.limit || 0,
        offset: action.payload.offset || 0,
        error: null,
      };

    case SEARCH_QUERY_ID_FAIL:
      return {
        loading: false,
        error: action.payload,
        items: [],
        count: 0,
        hasMore: false,
        limit: 0,
        offset: 0,
      };

    default:
      return state;
  }
};

export const searchQueryReducer = (state = { items: [] }, action) => {
  switch (action.type) {
    case SEARCH_QUERY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SEARCH_QUERY_SUCCESS:
      return {
        loading: false,
        items: action.payload.items,
        count: action.payload.count,
        hasMore: action.payload.hasMore,
      };
    case SEARCH_QUERY_FAIL:
      return {
        loading: false,
        error: action.payload,
        items: [],
      };
    default:
      return state;
  }
};

export const repliedQueryReducer = (state = { items: [] }, action) => {
  switch (action.type) {
    case REPLIED_QUERY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case REPLIED_QUERY_SUCCESS:
      return {
        loading: false,
        items: action.payload,
      };
    case REPLIED_QUERY_FAIL:
      return {
        loading: false,
        error: action.payload,
        items: [],
      };
    default:
      return state;
  }
};

export const userReducer = (state = { user: {} }, { type, payload }) => {
  switch (type) {
    case LOGIN_USER_REQUEST:
    case LOAD_USER_REQUEST:
      return {
        loading: true,
        isAuthenticated: false,
      };
    case LOGIN_USER_SUCCESS:
    case LOAD_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: payload,
      };
    case LOGOUT_USER_SUCCESS:
      return {
        loading: false,
        user: null,
        isAuthenticated: false,
      };
    case LOGIN_USER_FAIL:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: payload,
      };
    case LOAD_USER_FAIL:
      return {
        loading: false,
        isAuthenticated: false,
        user: null,
        error: payload,
      };
    case LOGOUT_USER_FAIL:
      return {
        ...state,
        loading: false,
        error: payload,
      };
    case CLEAR_ERRORS:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

