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
    REPLIED_QUERY_REQUEST,
    REPLIED_QUERY_SUCCESS,
    REPLIED_QUERY_FAIL,
    SEARCH_QUERY_REQUEST,
    SEARCH_QUERY_SUCCESS,
    SEARCH_QUERY_FAIL,
    SEARCH_QUERY_BY_ID_REQUEST,
    SEARCH_QUERY_BY_ID_SUCCESS,
    SEARCH_QUERY_BY_ID_FAIL,
} from '../constants/appConstants';
import axios from 'axios';

// Search query by Query ID (doc_id)
export const searchQueryById = (docId) => async (dispatch) => {
    try {
        dispatch({ type: SEARCH_QUERY_BY_ID_REQUEST });

        const { data } = await axios.get(
            `/afcao/ipas/ivrs/searchQuery_docId/${docId}`
        );

        dispatch({
            type: SEARCH_QUERY_BY_ID_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: SEARCH_QUERY_BY_ID_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

// Search queries by Service No + Category
export const searchQueryBySnoAndCategory = (serviceNo, category) => async (dispatch) => {
    try {
        dispatch({ type: SEARCH_QUERY_REQUEST });

        const { data } = await axios.get(
            `/afcao/ipas/ivrs/searchQuery_SNO_CAT/${serviceNo}/${category}`
        );

        dispatch({
            type: SEARCH_QUERY_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: SEARCH_QUERY_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const fetchRepliedQueries = (offset = 200) => async (dispatch) => {
    try {
        dispatch({ type: REPLIED_QUERY_REQUEST });

        const { data } = await axios.get(
            `/afcao/ipas/ivrs/repliedQuery?offset=${offset}`
        );

        dispatch({
            type: REPLIED_QUERY_SUCCESS,
            payload: data.items || [],
        });
    } catch (error) {
        dispatch({
            type: REPLIED_QUERY_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

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