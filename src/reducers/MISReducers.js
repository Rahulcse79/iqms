// MISReducers.js
import {
    MIS_APW_REQUEST,
    MIS_APW_SUCCESS,
    MIS_APW_FAIL,
  
    MIS_CPW_REQUEST,
    MIS_CPW_SUCCESS,
    MIS_CPW_FAIL,
  
    MIS_OPW_REQUEST,
    MIS_OPW_SUCCESS,
    MIS_OPW_FAIL,
  } from "../constants/MISConstants";
  
  const initialState = {
    loading: false,
    data: [],
    error: null,
  };
  
  // APW Reducer
  export const apwReducer = (state = initialState, action) => {
    switch (action.type) {
      case MIS_APW_REQUEST:
        return { ...state, loading: true, error: null };
      case MIS_APW_SUCCESS:
        return { ...state, loading: false, data: action.payload };
      case MIS_APW_FAIL:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  // CPW Reducer
  export const cpwReducer = (state = initialState, action) => {
    switch (action.type) {
      case MIS_CPW_REQUEST:
        return { ...state, loading: true, error: null };
      case MIS_CPW_SUCCESS:
        return { ...state, loading: false, data: action.payload };
      case MIS_CPW_FAIL:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  
  // OPW Reducer
  export const opwReducer = (state = initialState, action) => {
    switch (action.type) {
      case MIS_OPW_REQUEST:
        return { ...state, loading: true, error: null };
      case MIS_OPW_SUCCESS:
        return { ...state, loading: false, data: action.payload };
      case MIS_OPW_FAIL:
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };
  