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
} from '../constants/appConstants';
import axios from 'axios';

// Fetch personal data by ServiceNo & Category
export const fetchPersonalData = (serviceNo, category) => async (dispatch) => {
    try {
        dispatch({ type: FETCH_PERSONAL_DATA_REQUEST });

        const { data } = await axios.get(
            `/afcao/ipas/ivrs/fetch_pers_data/${serviceNo}/${category}`
        );

        dispatch({
            type: FETCH_PERSONAL_DATA_SUCCESS,
            payload: data.items[0],
        });
    } catch (error) {
        dispatch({
            type: FETCH_PERSONAL_DATA_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};


export const loginUser = (email, password) => async (dispatch) => {
    try {

        dispatch({ type: LOGIN_USER_REQUEST });

        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        }

        const { data } = await axios.post(
            '/api/v1/login',
            { email, password },
            config
        );

        dispatch({
            type: LOGIN_USER_SUCCESS,
            payload: data.user,
        });

    } catch (error) {
        dispatch({
            type: LOGIN_USER_FAIL,
            payload: error.response.data.message,
        });
    }
};

export const loadUser = () => async (dispatch) => {
    try {

        dispatch({ type: LOAD_USER_REQUEST });

        const { data } = await axios.get('/api/v1/me');

        dispatch({
            type: LOAD_USER_SUCCESS,
            payload: data.user,
        });

    } catch (error) {
        dispatch({
            type: LOAD_USER_FAIL,
            payload: error.response.data.message,
        });
    }
};

// Logout User
export const logoutUser = () => async (dispatch) => {
    try {
        await axios.get('/api/v1/logout');
        dispatch({ type: LOGOUT_USER_SUCCESS });
    } catch (error) {
        dispatch({
            type: LOGOUT_USER_FAIL,
            payload: error.response.data.message,
        });
    }
};

// Clear All Errors
export const clearErrors = () => async (dispatch) => {
    dispatch({ type: CLEAR_ERRORS });
};