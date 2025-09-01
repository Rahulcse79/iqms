// src/actions/queryActions.js
import api from "../utils/axiosInstance";
import {
  SEARCH_QUERY_REQUEST,
  SEARCH_QUERY_SUCCESS,
  SEARCH_QUERY_FAIL,
  CLEAR_QUERY_RESULTS,
} from "../constants/queryConstants";

// Search by Service No + Category (with slot tracking)
export const searchByServiceNoAndCategory = (serviceNo, category, slot) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_QUERY_REQUEST, meta: { slot } });

    const { data } = await api.get(`/searchQuery_SNO_CAT/${serviceNo}/1`);

    dispatch({
      type: SEARCH_QUERY_SUCCESS,
      payload: data.items || [],
      meta: { slot },
    });

    return data; // 👈 RETURN the API response so component can use it
  } catch (error) {
    dispatch({
      type: SEARCH_QUERY_FAIL,
      payload: error.message || "Something went wrong",
      meta: { slot },
    });

    throw error; // 👈 also rethrow so component can catch
  }
};


// Search by Query ID
export const searchByQueryId = (docId) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_QUERY_REQUEST, meta: { slot: "doc" } });

    const { data } = await api.get(`/searchQuery_docId/${docId}`);

    dispatch({
      type: SEARCH_QUERY_SUCCESS,
      payload: data.items || [],
      meta: { slot: "doc" },
    });
  } catch (error) {
    dispatch({
      type: SEARCH_QUERY_FAIL,
      payload: error.message || "Something went wrong",
      meta: { slot: "doc" },
    });
  }
};

// Clear all slots
export const clearQueryResults = () => (dispatch) => {
  dispatch({ type: CLEAR_QUERY_RESULTS });
};
