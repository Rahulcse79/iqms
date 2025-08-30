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
} from "../constants/appConstants";

const initialState = {
  loading: false,
  personalData: null,
  error: null,
};

export const personalDataReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PERSONAL_DATA_REQUEST:
      return { ...state, loading: true };
    case FETCH_PERSONAL_DATA_SUCCESS:
      return { loading: false, personalData: action.payload, error: null };
    case FETCH_PERSONAL_DATA_FAIL:
      return { loading: false, personalData: null, error: action.payload };
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

    // Rank history
    case RANK_HISTORY_REQUEST:
      return {
        ...state,
        rankHistory: { ...state.rankHistory, loading: true, error: null },
      };

    case RANK_HISTORY_SUCCESS:
      return {
        ...state,
        rankHistory: {
          ...state.rankHistory,
          loading: false,
          items: Array.isArray(payload?.items) ? payload.items : [],
          meta: payload || null,
          error: null,
        },
      };

    case RANK_HISTORY_FAIL:
      return {
        ...state,
        rankHistory: { ...state.rankHistory, loading: false, error: payload },
      };

    // Trade history
    case TRADE_HISTORY_REQUEST:
      return {
        ...state,
        tradeHistory: { ...state.tradeHistory, loading: true, error: null },
      };

    case TRADE_HISTORY_SUCCESS:
      return {
        ...state,
        tradeHistory: {
          ...state.tradeHistory,
          loading: false,
          items: Array.isArray(payload?.items) ? payload.items : [],
          meta: payload || null,
          error: null,
        },
      };

    case TRADE_HISTORY_FAIL:
      return {
        ...state,
        tradeHistory: { ...state.tradeHistory, loading: false, error: payload },
      };

    // Posting history
    case POSTING_HISTORY_REQUEST:
      return {
        ...state,
        postingHistory: { ...state.postingHistory, loading: true, error: null },
      };

    case POSTING_HISTORY_SUCCESS:
      return {
        ...state,
        postingHistory: {
          ...state.postingHistory,
          loading: false,
          items: Array.isArray(payload?.items) ? payload.items : [],
          meta: payload || null,
          error: null,
        },
      };

    case POSTING_HISTORY_FAIL:
      return {
        ...state,
        postingHistory: {
          ...state.postingHistory,
          loading: false,
          error: payload,
        },
      };

    default:
      return state;
  }
};
