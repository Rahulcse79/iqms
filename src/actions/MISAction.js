// MISActions.js
import axios from "axios";
import {
  MIS_APW_REQUEST, MIS_APW_SUCCESS, MIS_APW_FAIL,
  MIS_CPW_REQUEST, MIS_CPW_SUCCESS, MIS_CPW_FAIL,
  MIS_OPW_REQUEST, MIS_OPW_SUCCESS, MIS_OPW_FAIL,
} from "../constants/MISConstants";

// APW
export const fetchAPW = () => async (dispatch) => {
  try {
    dispatch({ type: MIS_APW_REQUEST });
    const { data } = await axios.get("/afcao/ipas/ivrs/IQMS_MIS_APW");
    dispatch({ type: MIS_APW_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: MIS_APW_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// CPW
export const fetchCPW = () => async (dispatch) => {
  try {
    dispatch({ type: MIS_CPW_REQUEST });
    const { data } = await axios.get("/afcao/ipas/ivrs/IQMS_MIS_CPW");
    dispatch({ type: MIS_CPW_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: MIS_CPW_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// OPW
export const fetchOPW = () => async (dispatch) => {
  try {
    dispatch({ type: MIS_OPW_REQUEST });
    const { data } = await axios.get("/afcao/ipas/ivrs/IQMS_MIS_OPW");
    dispatch({ type: MIS_OPW_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: MIS_OPW_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
