// src/actions/queryActions.js
import api from "../utils/axiosInstance";
import {
  SEARCH_QUERY_REQUEST,
  SEARCH_QUERY_SUCCESS,
  SEARCH_QUERY_FAIL,
  CLEAR_QUERY_RESULTS,
} from "../constants/queryConstants";

// Search by Service No + Category
export const searchByServiceNoAndCategory = (serviceNo, category) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_QUERY_REQUEST });

    const { data } = await api.get(`/searchQuery_SNO_CAT/${serviceNo}/${category}`);

    dispatch({
      type: SEARCH_QUERY_SUCCESS,
      payload: data.items || [],
    });
  } catch (error) {
    dispatch({
      type: SEARCH_QUERY_FAIL,
      payload: error.message || "Something went wrong",
    });
  }
};

// Search by Query ID
export const searchByQueryId = (docId) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_QUERY_REQUEST });

    const { data } = await api.get(`/searchQuery_docId/${docId}`);

    dispatch({
      type: SEARCH_QUERY_SUCCESS,
      payload: data.items || [],
    });
  } catch (error) {
    dispatch({
      type: SEARCH_QUERY_FAIL,
      payload: error.message || "Something went wrong",
    });
  }
};

// Clear results
export const clearQueryResults = () => (dispatch) => {
  dispatch({ type: CLEAR_QUERY_RESULTS });
};
