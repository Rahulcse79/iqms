import { LOGOUT_SUCCESS,
    LOGOUT_FAIL,
    LOGIN_REQUEST,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    CLEAR_ERRORS,
 } from "../constants/appConstants";
import axios from 'axios';

export const loginSeller = (email, password) => async (dispatch) => {
    try {

        dispatch({ type: LOGIN_REQUEST });

        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        }

        const { data } = await axios.post(
            '/api/v1/seller/login',
            { email, password },
            config
        );
        dispatch({
            type: LOGIN_SUCCESS,
            payload: data.user,
            payloadSellerData: data.sellerData,
        });

    } catch (error) {
        dispatch({
            type: LOGIN_FAIL,
            payload: error.response.data.message,
            payloadSellerData: error.response.data.message,
        });
    }
};

export const logout = () => async (dispatch) => {
    try {
        await axios.get('/api/v1/seller/logout');
        dispatch({ type: LOGOUT_SUCCESS });
    } catch (error) {
        dispatch({
            type: LOGOUT_FAIL,
            payload: error.response.data.message,
        });
    }
};

export const clearErrors = () => async (dispatch) => {
    dispatch({ type: CLEAR_ERRORS });
};