// src/reducers/queryReducer.js
import {
  SEARCH_QUERY_REQUEST,
  SEARCH_QUERY_SUCCESS,
  SEARCH_QUERY_FAIL,
  CLEAR_QUERY_RESULTS,
} from "../constants/queryConstants";

export const queryReducer = (state = { queries: [] }, { type, payload }) => {
  switch (type) {
    case SEARCH_QUERY_REQUEST:
      return {
        ...state,
        loading: true,
        queries: [],
        error: null,
      };

    case SEARCH_QUERY_SUCCESS:
      return {
        ...state,
        loading: false,
        queries: payload, // API response items
        error: null,
      };

    case SEARCH_QUERY_FAIL:
      return {
        ...state,
        loading: false,
        queries: [],
        error: payload, // error message
      };

    case CLEAR_QUERY_RESULTS:
      return {
        ...state,
        queries: [],
        error: null,
      };

    default:
      return state;
  }
};
