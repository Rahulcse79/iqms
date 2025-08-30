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
            }
        case LOGOUT_USER_FAIL:
            return {
                ...state,
                loading: false,
                error: payload,
            }
        case CLEAR_ERRORS:
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};