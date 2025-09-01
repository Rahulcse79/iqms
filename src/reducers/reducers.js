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
} from "../constants/appConstants";

/**
 * 🔹 Reducer: Search Query By ID
 */
export const searchQueryByIdReducer = (
  state = { item: null, loading: false, error: null, count: 0 },
  action
) => {
  switch (action.type) {
    case SEARCH_QUERY_BY_ID_REQUEST:
      return { ...state, loading: true, error: null };

    case SEARCH_QUERY_BY_ID_SUCCESS:
      return {
        loading: false,
        item: action.payload?.items?.[0] || null,
        count: action.payload?.count || 0,
        error: null,
      };

    case SEARCH_QUERY_BY_ID_FAIL:
      return { loading: false, error: action.payload, item: null, count: 0 };

    default:
      return state;
  }
};

/**
 * 🔹 Reducer: Search Queries (list)
 */
export const searchQueryReducer = (
  state = { items: [], loading: false, error: null, count: 0, hasMore: false },
  action
) => {
  switch (action.type) {
    case SEARCH_QUERY_REQUEST:
      return { ...state, loading: true, error: null };

    case SEARCH_QUERY_SUCCESS:
      return {
        loading: false,
        items: action.payload?.items || [],
        count: action.payload?.count || 0,
        hasMore: action.payload?.hasMore || false,
        error: null,
      };

    case SEARCH_QUERY_FAIL:
      return { loading: false, error: action.payload, items: [], count: 0 };

    default:
      return state;
  }
};

/**
 * 🔹 Reducer: Replied Queries
 */
export const repliedQueryReducer = (
  state = { items: [], loading: false, error: null },
  action
) => {
  switch (action.type) {
    case REPLIED_QUERY_REQUEST:
      return { ...state, loading: true, error: null };

    case REPLIED_QUERY_SUCCESS:
      return { loading: false, items: action.payload || [], error: null };

    case REPLIED_QUERY_FAIL:
      return { loading: false, error: action.payload, items: [] };

    default:
      return state;
  }
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

/**
 * 🔹 Reducer: User
 */
export const userReducer = (
  state = {
    user: {},
    isAuthenticated: false,
    loading: false,
    error: null,
    rankHistory: { items: [], loading: false, error: null },
    tradeHistory: { items: [], loading: false, error: null },
    postingHistory: { items: [], loading: false, error: null },
  },
  { type, payload }
) => {
  switch (type) {
    // Auth
    case LOGIN_USER_REQUEST:
    case LOAD_USER_REQUEST:
      return { ...state, loading: true, isAuthenticated: false };

    case LOGIN_USER_SUCCESS:
    case LOAD_USER_SUCCESS:
      return { ...state, loading: false, isAuthenticated: true, user: payload };

    case LOGOUT_USER_SUCCESS:
      return { ...state, loading: false, isAuthenticated: false, user: null };

    case LOGIN_USER_FAIL:
    case LOAD_USER_FAIL:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: payload,
      };

    case LOGOUT_USER_FAIL:
      return { ...state, loading: false, error: payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};
